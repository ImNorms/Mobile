// ComplaintsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "./firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

export default function ComplaintsScreen({ navigation }) {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "complaints"),
      where("userId", "==", user.uid), // 🔹 Change/remove if admin
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setComplaints(list);
    });

    return unsubscribe;
  }, []);

  const handleFileOpen = (url) => {
    if (url) {
      Linking.openURL(url).catch((err) =>
        console.error("Failed to open file:", err)
      );
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.text}>📌 {item.complaint}</Text>
      <Text style={styles.subtext}>Status: {item.status}</Text>
      <Text style={styles.subtext}>User ID: {item.userId}</Text>

      {item.fileUrl && (
        <TouchableOpacity onPress={() => handleFileOpen(item.fileUrl)}>
          {item.fileUrl.match(/\.(jpeg|jpg|png|gif)$/i) ? (
            <Image source={{ uri: item.fileUrl }} style={styles.image} />
          ) : (
            <Text style={styles.fileLink}>📎 Open attached file</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={complaints}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No complaints filed yet.</Text>
        }
        contentContainerStyle={{ paddingBottom: 100 }} // space for footer
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("FileComplaint")}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Footer (copied from FileComplaintScreen) */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#f9f9f9" },
  item: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginHorizontal: 10,
  },
  text: { fontSize: 16, fontWeight: "bold" },
  subtext: { fontSize: 14, color: "gray", marginTop: 5 },
  empty: { textAlign: "center", marginTop: 20, fontSize: 16, color: "gray" },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 20,
    backgroundColor: "#007AFF",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  image: { width: 100, height: 100, marginTop: 10, borderRadius: 8 },
  fileLink: { color: "#007AFF", marginTop: 10, textDecorationLine: "underline" },

  // Footer
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
  footerText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 3,
    textAlign: "center",
  },
});
