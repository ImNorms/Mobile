// AnnouncementScreen.js
import React, { useEffect, useState, useCallback } from "react";
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
  limit,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { db } from "./firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

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
  const [imageDimensions, setImageDimensions] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const storage = getStorage();

  const adminUIDs = ["ADMIN_UID_1", "ADMIN_UID_2"];

  // -----------------------------
  // Notification / Red Dot Logic
  // -----------------------------
  const getLastSeenAnnouncement = async (uid) => {
    if (!uid) return null;
    return await AsyncStorage.getItem(`lastSeenAnnouncement_${uid}`);
  };

  const setLastSeenAnnouncement = async (uid, timestamp) => {
    if (!uid) return;
    await AsyncStorage.setItem(`lastSeenAnnouncement_${uid}`, String(timestamp));
  };

  // Listen for latest announcement post
  useEffect(() => {
    if (!currentUser?.uid) return;

    const latestPostQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(latestPostQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const latestPost = snapshot.docs[0].data();
        const latestTimestamp = latestPost.createdAt?.seconds || 0;

        const lastSeenRaw = await getLastSeenAnnouncement(currentUser.uid);
        const lastSeen = Number(lastSeenRaw) || 0;

        if (!lastSeenRaw) {
          // first time user opens, store initial value but no red dot
          await setLastSeenAnnouncement(currentUser.uid, latestTimestamp);
          navigation.setParams({ hasNewAnnouncement: false });
        } else {
          navigation.setParams({
            hasNewAnnouncement: latestTimestamp > lastSeen,
          });
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Mark announcements as seen when screen is opened
  useFocusEffect(
    useCallback(() => {
      if (posts.length > 0 && currentUser?.uid) {
        const latest = posts[0].createdAt?.seconds;
        if (latest) {
          setLastSeenAnnouncement(currentUser.uid, latest);
          navigation.setParams({ hasNewAnnouncement: false });
        }
      }
    }, [posts, currentUser])
  );
  // -----------------------------

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
    return (
      reacts[postId]?.some((react) => react.userId === currentUser?.uid) || false
    );
  };

  const toggleLike = async (postId) => {
    if (!currentUser?.uid) return;

    try {
      const reactsRef = collection(db, "posts", postId, "reacts");
      const userReactQuery = query(
        reactsRef,
        where("userId", "==", currentUser.uid)
      );

      const snapshot = await getDocs(userReactQuery);

      const postRef = doc(db, "posts", postId);
      const currentPost = posts.find((p) => p.id === postId);

      if (snapshot.empty) {
        await addDoc(reactsRef, {
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          type: "like",
        });
        await updateDoc(postRef, {
          reactsCount: (currentPost?.reactsCount || 0) + 1,
        });
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
      await updateDoc(postRef, {
        commentsCount: (currentCommentsCount || 0) + 1,
      });

      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const deleteComment = async (postId, commentId, currentCommentsCount) => {
    try {
      await deleteDoc(doc(db, "posts", postId, "comments", commentId));
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        commentsCount: Math.max(0, (currentCommentsCount || 1) - 1),
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const startEditComment = (comment) => {
    setEditingComment(comment);
    setEditText(comment.text);
  };

  const saveEditedComment = async (postId, commentId) => {
    if (!editText.trim()) return;

    try {
      const commentRef = doc(db, "posts", postId, "comments", commentId);
      await updateDoc(commentRef, { text: editText.trim() });
      setEditingComment(null);
      setEditText("");
    } catch (error) {
      console.error("Error editing comment:", error);
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

  const calculateImageHeight = (postId, containerWidth = 350) => {
    const dimensions = imageDimensions[postId];
    if (!dimensions) return 200;
    const aspectRatio = dimensions.width / dimensions.height;
    const calculatedHeight = containerWidth / aspectRatio;
    return Math.min(Math.max(calculatedHeight, 150), 400);
  };

  useEffect(() => {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribePosts = onSnapshot(
      postsQuery,
      async (snapshot) => {
        const postsData = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const imageUrl = data.mediaUrl || data.imageUrl || "";
          return {
            id: docSnap.id,
            ...data,
            title: data.content || "No title",
            description: data.content || "No description",
            author: { name: data.authorName || "HOA Member" },
            createdAt: data.createdAt,
            imageUrl: imageUrl,
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
                user:
                  commentData.authorName ||
                  commentData.user ||
                  commentData.userName ||
                  "Anonymous",
                isAdmin: commentData.isAdmin || false,
                createdAt: commentData.createdAt,
                userId: commentData.userId,
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
          <Text style={styles.authorName}>
            {item.author?.name || "HOA Member"}
          </Text>
          <Text style={styles.postTime}>
            {item.createdAt
              ? new Date(item.createdAt.seconds * 1000).toLocaleString()
              : "Date not available"}
          </Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {item.category?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postDescription}>{item.description}</Text>

        {item.imageUrl &&
        !imageErrors[item.id] &&
        item.imageUrl.trim() !== "" &&
        !item.imageUrl.includes("via.placeholder.com") ? (
          <View style={styles.imageContainer}>
            {imageLoadingStates[item.id] && !imageDimensions[item.id] ? (
              <View
                style={[
                  styles.imageLoader,
                  { height: calculateImageHeight(item.id) },
                ]}
              >
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading image...</Text>
              </View>
            ) : null}
            <Image
              source={{
                uri: item.imageUrl,
                cache: "force-cache",
              }}
              style={[
                styles.postImage,
                {
                  height: calculateImageHeight(item.id),
                  minHeight: 150,
                },
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
                setImageErrors((prev) => ({ ...prev, [item.id]: false }));
                setImageLoadingStates((prev) => ({ ...prev, [item.id]: true }));
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.postStats}>
        <Text style={styles.statText}>{item.reactsCount || 0} likes</Text>
        <Text style={styles.statText}>
          {commentCounts[item.id] || 0} comments
        </Text>
      </View>

      <View style={styles.postActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            hasUserReacted(item.id) && styles.activeActionButton,
          ]}
          onPress={() => toggleLike(item.id)}
        >
          <Ionicons
            name={hasUserReacted(item.id) ? "heart" : "heart-outline"}
            size={20}
            color={hasUserReacted(item.id) ? "#e74c3c" : "#555"}
          />
          <Text
            style={[
              styles.actionText,
              hasUserReacted(item.id) && styles.activeActionText,
            ]}
          >
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setSelectedPost(item)}
        >
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
        ListEmptyComponent={
          <Text style={styles.empty}>No announcements yet.</Text>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <Modal
        visible={!!selectedPost}
        animationType="slide"
        onRequestClose={() => setSelectedPost(null)}
      >
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
                      style={[
                        styles.commentRow,
                        comment.isAdmin && styles.adminComment,
                      ]}
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
                              {new Date(
                                comment.createdAt.seconds * 1000
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          )}
                        </View>

                        {editingComment?.id === comment.id ? (
                          <View
                            style={{ flexDirection: "row", alignItems: "center" }}
                          >
                            <TextInput
                              style={[
                                styles.commentInput,
                                { flex: 1, marginVertical: 4 },
                              ]}
                              value={editText}
                              onChangeText={setEditText}
                              autoFocus
                            />
                            <TouchableOpacity
                              style={styles.saveButton}
                              onPress={() =>
                                saveEditedComment(selectedPost.id, comment.id)
                              }
                            >
                              <Text style={{ color: "#fff" }}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.cancelButton, { marginLeft: 6 }]}
                              onPress={() => {
                                setEditingComment(null);
                                setEditText("");
                              }}
                            >
                              <Text style={{ color: "#fff" }}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <Text style={styles.commentText}>
                            {comment.text ||
                              comment.content ||
                              "No comment text"}
                          </Text>
                        )}

                        {(comment.userId === currentUser?.uid ||
                          adminUIDs.includes(currentUser?.uid)) && (
                          <View style={styles.commentActions}>
                            <TouchableOpacity
                              onPress={() => startEditComment(comment)}
                            >
                              <Text style={styles.actionLink}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() =>
                                deleteComment(
                                  selectedPost.id,
                                  comment.id,
                                  selectedPost.commentsCount
                                )
                              }
                            >
                              <Text
                                style={[styles.actionLink, { color: "red" }]}
                              >
                                Delete
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
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
                    setCommentTexts((prev) => ({
                      ...prev,
                      [selectedPost.id]: text,
                    }))
                  }
                  onSubmitEditing={() =>
                    addComment(selectedPost.id, selectedPost.commentsCount)
                  }
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={() =>
                    addComment(selectedPost.id, selectedPost.commentsCount)
                  }
                >
                  <Ionicons name="send" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={{
                padding: 12,
                alignItems: "center",
                backgroundColor: "#004d40",
              }}
              onPress={() => setSelectedPost(null)}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  empty: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#555",
  },
  postContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    margin: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  postHeaderInfo: {
    flex: 1,
  },
  authorName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
  },
  postTime: {
    fontSize: 12,
    color: "#777",
  },
  categoryBadge: {
    backgroundColor: "#e1f5fe",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
  },
  postContent: {
    marginBottom: 10,
  },
  postTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  postDescription: {
    fontSize: 14,
    color: "#555",
  },
  imageContainer: {
    marginTop: 10,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f8f8f8",
  },
  postImage: {
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  imageLoader: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  imageError: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginTop: 10,
  },
  imageErrorText: {
    marginTop: 8,
    color: "#888",
    fontSize: 14,
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  postStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginVertical: 8,
  },
  statText: {
    fontSize: 13,
    color: "#666",
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 5,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
  },
  activeActionButton: {
    backgroundColor: "#ffebee",
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
  },
  activeActionText: {
    color: "#e74c3c",
  },
  commentsSection: {
    padding: 15,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  commentTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
  },
  commentRow: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 8,
  },
  adminComment: {
    backgroundColor: "#fff8e1",
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  commentAvatarText: {
    color: "white",
    fontWeight: "bold",
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  commentUserName: {
    fontWeight: "bold",
    fontSize: 14,
  },
  adminName: {
    color: "#e67e22",
  },
  commentTime: {
    fontSize: 11,
    color: "#777",
  },
  commentText: {
    fontSize: 14,
    marginTop: 2,
  },
  commentActions: {
    flexDirection: "row",
    marginTop: 4,
  },
  actionLink: {
    marginRight: 12,
    fontSize: 13,
    fontWeight: "bold",
    color: "#007AFF",
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "white",
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 20,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: "#999",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
});