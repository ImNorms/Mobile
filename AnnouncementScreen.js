// AnnouncementScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
} from "react-native";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
  deleteDoc,
  getDocs,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "./firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

export default function AnnouncementScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCommentBox, setActiveCommentBox] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const [comments, setComments] = useState({});
  const [reacts, setReacts] = useState({});
  const [commentCounts, setCommentCounts] = useState({});

  const auth = getAuth();
  const currentUser = auth.currentUser;

  const adminUIDs = ["ADMIN_UID_1", "ADMIN_UID_2"];

  const getCommentCount = async (postId) => {
    try {
      const commentsRef = collection(db, "posts", postId, "comments");
      const snapshot = await getCountFromServer(commentsRef);
      return snapshot.data().count;
    } catch (error) {
      console.error("Error getting comment count:", error);
      return 0;
    }
  };

  const updateAllCommentCounts = async () => {
    const counts = {};
    for (const post of posts) {
      counts[post.id] = await getCommentCount(post.id);
    }
    setCommentCounts(counts);
  };

  useEffect(() => {
    const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    const unsubscribePosts = onSnapshot(
      postsQuery,
      async (snapshot) => {
        const postsData = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            title: data.content || "No title",
            description: data.content || "No description",
            author: { name: data.authorName || "HOA Member" },
            createdAt: data.createdAt,
            imageUrl: data.imageUrl || "",
            category: data.category || "announcement",
            reactsCount: data.reactsCount || 0,
            commentsCount: data.commentsCount || 0,
          };
        });

        setPosts(postsData);
        setLoading(false);

        const counts = {};
        for (const post of postsData) {
          counts[post.id] = await getCommentCount(post.id);
        }
        setCommentCounts(counts);

        postsData.forEach((post) => {
          const commentsQuery = query(
            collection(db, "posts", post.id, "comments"),
            orderBy("createdAt", "asc")
          );

          onSnapshot(commentsQuery, (commentsSnapshot) => {
            const postComments = commentsSnapshot.docs.map((commentDoc) => {
              const commentData = commentDoc.data();
              return {
                id: commentDoc.id,
                text: commentData.text || commentData.content || "",
                user: commentData.user || commentData.userName || commentData.userId || "Anonymous",
                userId: commentData.userId,
                isAdmin: commentData.isAdmin || false,
                createdAt: commentData.createdAt,
                ...commentData
              };
            });
            setComments((prev) => ({ ...prev, [post.id]: postComments }));
            
            setCommentCounts((prev) => ({
              ...prev,
              [post.id]: commentsSnapshot.size
            }));
          });

          const reactsQuery = query(collection(db, "posts", post.id, "reacts"));
          onSnapshot(reactsQuery, (reactsSnapshot) => {
            const postReacts = reactsSnapshot.docs.map((reactDoc) => ({
              id: reactDoc.id,
              ...reactDoc.data(),
            }));
            setReacts((prev) => ({ ...prev, [post.id]: postReacts }));
          });
        });
      },
      (error) => {
        console.error("Error fetching posts:", error);
        setLoading(false);
      }
    );

    return () => unsubscribePosts();
  }, []);

  const hasUserReacted = (postId) => {
    return reacts[postId]?.some((react) => react.userId === currentUser?.uid) || false;
  };

  const toggleLike = async (postId) => {
    if (!currentUser?.uid) return;

    try {
      const reactsRef = collection(db, "posts", postId, "reacts");
      const userReactQuery = query(reactsRef, where("userId", "==", currentUser.uid));

      const snapshot = await getDocs(userReactQuery);

      const postRef = doc(db, "posts", postId);
      const currentPost = posts.find((p) => p.id === postId);

      if (snapshot.empty) {
        await addDoc(reactsRef, {
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          type: "like",
        });
        await updateDoc(postRef, { reactsCount: (currentPost?.reactsCount || 0) + 1 });
      } else {
        const reactDoc = snapshot.docs[0];
        await deleteDoc(doc(db, "posts", postId, "reacts", reactDoc.id));
        await updateDoc(postRef, {
          reactsCount: Math.max(0, (currentPost?.reactsCount || 0) - 1),
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const addComment = async (postId, currentCommentsCount) => {
    const text = commentTexts[postId];
    if (!text?.trim() || !currentUser?.uid) return;

    try {
      const commentsRef = collection(db, "posts", postId, "comments");

      await addDoc(commentsRef, {
        text: text.trim(),
        user: currentUser.displayName || "Anonymous",
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonymous",
        isAdmin: adminUIDs.includes(currentUser.uid),
        createdAt: serverTimestamp(),
      });

      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, { commentsCount: (currentCommentsCount || 0) + 1 });

      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
      setActiveCommentBox(null);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Render each post with new design
  const renderItem = ({ item }) => (
    <View style={styles.postContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.author?.name || "H").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.postHeaderInfo}>
          <Text style={styles.authorName}>{item.author?.name || "HOA Member"}</Text>
          <Text style={styles.postTime}>
            {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleString() : "Date not available"}
          </Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Post Content */}
      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postDescription}>{item.description}</Text>
        
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
        ) : null}
      </View>

      {/* Post Stats */}
      <View style={styles.postStats}>
        <Text style={styles.statText}>{item.reactsCount || 0} likes</Text>
        <Text style={styles.statText}>{commentCounts[item.id] || 0} comments</Text>
      </View>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={[styles.actionButton, hasUserReacted(item.id) && styles.activeActionButton]}
          onPress={() => toggleLike(item.id)}
        >
          <Ionicons
            name={hasUserReacted(item.id) ? "heart" : "heart-outline"}
            size={20}
            color={hasUserReacted(item.id) ? "#e74c3c" : "#555"}
          />
          <Text style={[styles.actionText, hasUserReacted(item.id) && styles.activeActionText]}>
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setActiveCommentBox(activeCommentBox === item.id ? null : item.id)}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#555" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {comments[item.id]?.length > 0 && (
        <View style={styles.commentsSection}>
          <Text style={styles.commentTitle}>Comments</Text>
          {comments[item.id].map((comment) => (
            <View
              key={comment.id}
              style={[styles.commentRow, comment.isAdmin && styles.adminComment]}
            >
              <View style={styles.commentAvatar}>
                <Text style={styles.commentAvatarText}>
                  {(comment.user || comment.userId || "A").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                  <Text style={[styles.commentUserName, comment.isAdmin && styles.adminName]}>
                    {comment.user || comment.userId || "Anonymous"} 
                    {comment.isAdmin && " • Admin"}
                  </Text>
                  {comment.createdAt && (
                    <Text style={styles.commentTime}>
                      {new Date(comment.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                  )}
                </View>
                <Text style={styles.commentText}>
                  {comment.text || comment.content || "No comment text"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Comment Input */}
      {currentUser && activeCommentBox === item.id && (
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            autoFocus
            value={commentTexts[item.id] || ""}
            onChangeText={(text) => setCommentTexts((prev) => ({ ...prev, [item.id]: text }))}
            onSubmitEditing={() => addComment(item.id, item.commentsCount)}
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={() => addComment(item.id, item.commentsCount)}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading announcements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No announcements yet.</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Footer */}
      <View style={styles.footer}>
         <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("Profile")}>
           <Ionicons name="person-circle" size={22} color="#fff" />
           <Text style={styles.footerText}>Account</Text>
         </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("Home")}>
          <Ionicons name="home" size={22} color="#fff" />
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.replace("Login")}>
          <Ionicons name="log-out" size={22} color="#fff" />
          <Text style={styles.footerText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { 
    flex: 1, 
    backgroundColor: "#f0f2f5" 
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  loadingText: { 
    marginTop: 10, 
    color: "gray" 
  },
  // New post container style
  postContainer: {
    backgroundColor: "#fff",
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  // Post header with avatar and info
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  postHeaderInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  postTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: '#e1f5fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0288d1',
  },
  // Post content area
  postContent: {
    padding: 16,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  // Post stats
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statText: {
    fontSize: 12,
    color: '#888',
  },
  // Post actions (like, comment buttons)
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
  },
  activeActionButton: {
    backgroundColor: '#ffeaea',
  },
  actionText: {
    marginLeft: 6,
    color: '#555',
    fontWeight: '500',
  },
  activeActionText: {
    color: '#e74c3c',
  },
  // Comments section
  commentsSection: {
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  adminComment: {
    borderLeftWidth: 3,
    borderLeftColor: '#8e44ad',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9c27b0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commentAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUserName: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#333',
  },
  adminName: {
    color: '#8e44ad',
  },
  commentTime: {
    fontSize: 10,
    color: '#888',
  },
  commentText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 18,
  },
  // Comment input
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: { 
    textAlign: "center", 
    marginTop: 20, 
    fontSize: 16, 
    color: "gray" 
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: "#004d40",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerButton: {
    alignItems: 'center',
  },
  footerText: { 
    color: "#fff", 
    fontSize: 12, 
    marginTop: 3, 
    textAlign: "center" 
  },
});