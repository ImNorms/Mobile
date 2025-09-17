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
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { db } from "./firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

export default function AnnouncementScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentTexts, setCommentTexts] = useState({});
  const [comments, setComments] = useState({});
  const [reacts, setReacts] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [selectedPost, setSelectedPost] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [imageDimensions, setImageDimensions] = useState({}); // New state for image dimensions

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const storage = getStorage();

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
        authorName: currentUser.displayName || "Anonymous",
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonymous",
        isAdmin: adminUIDs.includes(currentUser.uid),
        createdAt: serverTimestamp(),
      });

      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, { commentsCount: (currentCommentsCount || 0) + 1 });

      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleImageError = (postId, error) => {
    setImageErrors((prev) => ({ ...prev, [postId]: true }));
    setImageLoadingStates((prev) => ({ ...prev, [postId]: false }));
  };

  const handleImageLoad = (postId, event) => {
    const { width, height } = event.nativeEvent.source;
    setImageDimensions((prev) => ({ ...prev, [postId]: { width, height } }));
    setImageLoadingStates((prev) => ({ ...prev, [postId]: false }));
  };

  const handleImageLoadStart = (postId) => {
    setImageLoadingStates((prev) => ({ ...prev, [postId]: true }));
  };

  // Calculate image height to maintain aspect ratio
  const calculateImageHeight = (postId, containerWidth = 350) => {
    const dimensions = imageDimensions[postId];
    if (!dimensions) return 200; // Default height

    const aspectRatio = dimensions.width / dimensions.height;
    const calculatedHeight = containerWidth / aspectRatio;
    
    // Set reasonable min and max heights
    return Math.min(Math.max(calculatedHeight, 150), 400);
  };

  useEffect(() => {
    const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    const unsubscribePosts = onSnapshot(
      postsQuery,
      async (snapshot) => {
        const postsData = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          
          // Use mediaUrl instead of imageUrl (based on your logs)
          const imageUrl = data.mediaUrl || data.imageUrl || "";
          
          return {
            id: docSnap.id,
            ...data,
            title: data.content || "No title",
            description: data.content || "No description",
            author: { name: data.authorName || "HOA Member" },
            createdAt: data.createdAt,
            imageUrl: imageUrl, // This is the key change - use mediaUrl
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
                user: commentData.authorName || commentData.user || commentData.userName || "Anonymous",
                isAdmin: commentData.isAdmin || false,
                createdAt: commentData.createdAt,
                ...commentData,
              };
            });
            setComments((prev) => ({ ...prev, [post.id]: postComments }));

            setCommentCounts((prev) => ({
              ...prev,
              [post.id]: commentsSnapshot.size,
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

  const renderItem = ({ item }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.author?.name || "H").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.postHeaderInfo}>
          <Text style={styles.authorName}>{item.author?.name || "HOA Member"}</Text>
          <Text style={styles.postTime}>
            {item.createdAt
              ? new Date(item.createdAt.seconds * 1000).toLocaleString()
              : "Date not available"}
          </Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postDescription}>{item.description}</Text>

        {item.imageUrl && !imageErrors[item.id] && item.imageUrl.trim() !== '' && !item.imageUrl.includes('via.placeholder.com') ? (
          <View style={styles.imageContainer}>
            {imageLoadingStates[item.id] && (
              <View style={[styles.imageLoader, { height: calculateImageHeight(item.id) }]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading image...</Text>
              </View>
            )}
            <Image 
              source={{ 
                uri: item.imageUrl,
                // Add cache control headers
                cache: 'force-cache'
              }} 
              style={[
                styles.postImage,
                { 
                  height: calculateImageHeight(item.id),
                  minHeight: 150,
                }
              ]}
              resizeMode="contain"
              onLoadStart={() => handleImageLoadStart(item.id)}
              onLoad={(event) => handleImageLoad(item.id, event)}
              onError={(error) => handleImageError(item.id, error)}
            />
          </View>
        ) : null}
        
        {imageErrors[item.id] && (
          <View style={styles.imageError}>
            <Ionicons name="image-outline" size={40} color="#ccc" />
            <Text style={styles.imageErrorText}>Image failed to load</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                // Reset error state and try loading again
                setImageErrors(prev => ({ ...prev, [item.id]: false }));
                setImageLoadingStates(prev => ({ ...prev, [item.id]: true }));
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.postStats}>
        <Text style={styles.statText}>{item.reactsCount || 0} likes</Text>
        <Text style={styles.statText}>{commentCounts[item.id] || 0} comments</Text>
      </View>

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
          <Text
            style={[styles.actionText, hasUserReacted(item.id) && styles.activeActionText]}
          >
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => setSelectedPost(item)}>
          <Ionicons name="chatbubble-outline" size={20} color="#555" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
      </View>
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

      <Modal visible={!!selectedPost} animationType="slide" onRequestClose={() => setSelectedPost(null)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={{ flex: 1, backgroundColor: "#fff" }}>
            <ScrollView>
              {selectedPost && renderItem({ item: selectedPost })}

              {selectedPost && comments[selectedPost.id]?.length > 0 && (
                <View style={styles.commentsSection}>
                  <Text style={styles.commentTitle}>Comments</Text>
                  {comments[selectedPost.id].map((comment) => (
                    <View
                      key={comment.id}
                      style={[styles.commentRow, comment.isAdmin && styles.adminComment]}
                    >
                      <View style={styles.commentAvatar}>
                        <Text style={styles.commentAvatarText}>
                          {(comment.user || "A").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                          <Text
                            style={[
                              styles.commentUserName,
                              comment.isAdmin && styles.adminName,
                            ]}
                          >
                            {comment.user || "Anonymous"}
                            {comment.isAdmin && " • Admin"}
                          </Text>
                          {comment.createdAt && (
                            <Text style={styles.commentTime}>
                              {new Date(comment.createdAt.seconds * 1000).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
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
            </ScrollView>

            {selectedPost && currentUser && (
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Write a comment..."
                  autoFocus
                  value={commentTexts[selectedPost.id] || ""}
                  onChangeText={(text) =>
                    setCommentTexts((prev) => ({ ...prev, [selectedPost.id]: text }))
                  }
                  onSubmitEditing={() => addComment(selectedPost.id, selectedPost.commentsCount)}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={() => addComment(selectedPost.id, selectedPost.commentsCount)}
                >
                  <Ionicons name="send" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={{ padding: 12, alignItems: "center", backgroundColor: "#004d40" }}
              onPress={() => setSelectedPost(null)}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  wrapper: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#555" },
  empty: { textAlign: "center", marginTop: 20, fontSize: 16, color: "#555" },
  postContainer: { backgroundColor: "#fff", padding: 12, margin: 10, borderRadius: 8 },
  postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  postHeaderInfo: { flex: 1 },
  authorName: { fontWeight: "bold", fontSize: 16 },
  postTime: { fontSize: 12, color: "#666" },
  categoryBadge: {
    backgroundColor: "#eee",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: { fontSize: 12, color: "#333" },
  postContent: { marginVertical: 8 },
  postTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  postDescription: { fontSize: 14, color: "#444" },
  imageContainer: {
    position: 'relative',
    marginTop: 8,
    backgroundColor: '#f9f9f9', // Light background for better contrast
    borderRadius: 8,
    overflow: 'hidden',
  },
  postImage: { 
    width: "100%",
    borderRadius: 8,
  },
  imageLoader: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: '#f9f9f9',
  },
  imageError: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginTop: 8,
  },
  imageErrorText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  postStats: { flexDirection: "row", justifyContent: "space-between", marginVertical: 6 },
  statText: { fontSize: 14, color: "#666" },
  postActions: { flexDirection: "row", justifyContent: "space-around", marginTop: 6 },
  actionButton: { flexDirection: "row", alignItems: "center", padding: 6 },
  actionText: { marginLeft: 4, fontSize: 14, color: "#555" },
  activeActionButton: { backgroundColor: "#fee" },
  activeActionText: { color: "#e74c3c" },
  commentsSection: { padding: 12 },
  commentTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 8 },
  commentRow: { flexDirection: "row", marginBottom: 10 },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  commentAvatarText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: "row", justifyContent: "space-between" },
  commentUserName: { fontWeight: "bold", fontSize: 14 },
  adminName: { color: "#e67e22" },
  commentTime: { fontSize: 12, color: "#999", marginLeft: 8 },
  commentText: { fontSize: 14, marginTop: 2 },
  commentInputContainer: {
    flexDirection: "row",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  commentInput: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 20, paddingHorizontal: 12, marginRight: 8 },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#004d40",
    paddingVertical: 10,
  },
  footerButton: { alignItems: "center" },
  footerText: { color: "#fff", fontSize: 12, marginTop: 2 },
});