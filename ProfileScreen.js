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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "./firebaseConfig"; // ✅ make sure db is exported from firebaseConfig
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser({
        uid: currentUser.uid,
        name: currentUser.displayName || "No name",
        email: currentUser.email,
        photoURL: currentUser.photoURL,
      });
    }
  }, []);

  // ✅ Save new name to Auth + Firestore
  const handleSaveName = async () => {
    if (!auth.currentUser) return;

    try {
      // Update Auth profile
      await updateProfile(auth.currentUser, { displayName: newName });

      // 🔑 Update Firestore (use members collection, not users)
      const userRef = doc(db, "members", auth.currentUser.uid);
      await updateDoc(userRef, { name: newName });

      // Update state
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
      {/* Profile Content */}
      <View style={styles.profileBox}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name[0] : "?"}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Footer Nav */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person-circle" size={22} color="#fff" />
          <Text style={styles.footerText}>Account</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Ionicons name="home" size={22} color="#fff" />
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace("Login")}>
          <Ionicons name="log-out" size={22} color="#fff" />
          <Text style={styles.footerText}>Log out</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for editing name */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>Edit Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new name"
              value={newName}
              onChangeText={setNewName}
            />
            <View style={{ flexDirection: "row", marginTop: 15 }}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#00695C" }]}
                onPress={handleSaveName}
              >
                <Text style={{ color: "#fff" }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "gray" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4" },
  profileBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    backgroundColor: "#00695C",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 40, color: "#fff" },
  name: { fontSize: 22, fontWeight: "bold", marginTop: 5 },
  email: { fontSize: 16, color: "gray", marginBottom: 20 },
  editButton: {
    flexDirection: "row",
    backgroundColor: "#00695C",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "bold",
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
  footerText: { color: "#fff", fontSize: 12, marginTop: 3, textAlign: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 8,
    padding: 10,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
});
