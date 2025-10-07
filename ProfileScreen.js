// ProfileScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ScrollView,
  useWindowDimensions,
  StatusBar,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "./firebaseConfig";
import { updateProfile, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    // Animation on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ✅ Fetch user data from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, "members", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUser({
              uid: currentUser.uid,
              name: userData.name || currentUser.displayName || "No name",
              email: userData.email || currentUser.email,
              photoURL: userData.photoURL || currentUser.photoURL,
              address: userData.address || "N/A",
              civilStatus: userData.civilStatus || "N/A",
              contact: userData.contact || "N/A",
              dob: userData.dob || "N/A",
              firstname: userData.firstname || "N/A",
              middlename: userData.middlename || "N/A",
              surname: userData.surname || "N/A",
              role: userData.role || "N/A",
              status: userData.status || "N/A",
            });
          } else {
            setUser({
              uid: currentUser.uid,
              name: currentUser.displayName || "No name",
              email: currentUser.email,
              photoURL: currentUser.photoURL,
            });
          }
        } catch (error) {
          console.error("❌ Error fetching user data:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Save new name to Auth + Firestore
  const handleSaveName = async () => {
    if (!auth.currentUser) return;

    try {
      await updateProfile(auth.currentUser, { displayName: newName });

      const userRef = doc(db, "members", auth.currentUser.uid);
      await updateDoc(userRef, { name: newName });

      setUser((prev) => ({ ...prev, name: newName }));
      setModalVisible(false);
      setNewName("");
      console.log("✅ Name updated in Auth + Firestore!");
    } catch (err) {
      console.error("❌ Error updating name:", err);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00695C" />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.headerAccent} />
      </View>

      {/* Profile Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.profileCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Profile Header Section */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user?.name ? user.name[0].toUpperCase() : "?"}
                  </Text>
                </View>
              )}
              <View style={styles.onlineIndicator} />
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user?.name}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user?.role || "Member"}</Text>
              </View>
            </View>
          </View>

          {/* Personal Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Ionicons name="person-outline" size={20} color="#00695C" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>
                    {user?.firstname} {user?.middlename} {user?.surname}
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Ionicons name="call-outline" size={20} color="#00695C" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Contact</Text>
                  <Text style={styles.infoValue}>{user?.contact}</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Ionicons name="calendar-outline" size={20} color="#00695C" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Date of Birth</Text>
                  <Text style={styles.infoValue}>{user?.dob}</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Ionicons name="heart-outline" size={20} color="#00695C" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Civil Status</Text>
                  <Text style={styles.infoValue}>{user?.civilStatus}</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Ionicons name="business-outline" size={20} color="#00695C" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Role</Text>
                  <Text style={styles.infoValue}>{user?.role}</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Ionicons name="flag-outline" size={20} color="#00695C" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={styles.infoValue}>{user?.status}</Text>
                </View>
              </View>

              <View style={[styles.infoCard, styles.fullWidth]}>
                <Ionicons name="location-outline" size={20} color="#00695C" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{user?.address}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Modern Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons name="home-outline" size={24} color="#666" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navButton, styles.activeNavButton]}
          onPress={() => navigation.navigate("Profile")}
        >
          <Ionicons name="person" size={24} color="#00695C" />
          <Text style={[styles.navText, styles.activeNavText]}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.replace("Login")}
        >
          <Ionicons name="log-out-outline" size={24} color="#666" />
          <Text style={styles.navText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Modern Modal for editing name */}
      <Modal 
        visible={modalVisible} 
        animationType="fade" 
        transparent={true}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: fadeAnim }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Your Name</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Enter your new name"
              placeholderTextColor="#999"
              value={newName}
              onChangeText={setNewName}
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveName}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8fafc" 
  },
  header: {
    backgroundColor: "#00695C",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  headerAccent: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 20,
    backgroundColor: "#00695C",
    transform: [{ rotate: '45deg' }],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#e2e8f0",
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#00695C",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#e2e8f0",
  },
  avatarText: { 
    fontSize: 32, 
    color: "#fff",
    fontWeight: "600",
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    backgroundColor: "#10b981",
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 8,
  },
  profileInfo: {
    flex: 1,
  },
  name: { 
    fontSize: 24, 
    fontWeight: "700", 
    color: "#1e293b",
    marginBottom: 4,
  },
  email: { 
    fontSize: 16, 
    color: "#64748b", 
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  infoGrid: {
    gap: 12,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#00695C",
  },
  fullWidth: {
    width: '100%',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
  },
  editButton: {
    flexDirection: "row",
    backgroundColor: "#00695C",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00695C",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  activeNavButton: {
    transform: [{ translateY: -5 }],
  },
  navText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontWeight: "500",
  },
  activeNavText: {
    color: "#00695C",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 0,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  closeButton: {
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    margin: 24,
    marginTop: 0,
    fontSize: 16,
    backgroundColor: "#f8fafc",
    color: "#1e293b",
  },
  modalButtons: {
    flexDirection: "row",
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
  },
  saveButton: {
    backgroundColor: "#00695C",
    shadowColor: "#00695C",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});