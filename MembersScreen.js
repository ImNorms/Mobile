import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { collection, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "./firebaseConfig";

export default function MembersScreen() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      collection(db, "members"),
      (snapshot) => {
        let data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // ✅ Sort so active user comes first
        data.sort((a, b) => {
          const isAActive = currentUser && a.id === currentUser.uid;
          const isBActive = currentUser && b.id === currentUser.uid;
          return isBActive - isAActive; // active (true=1) goes before inactive (false=0)
        });

        setMembers(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching members: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading members...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isActive = currentUser && item.id === currentUser.uid;
          return (
            <View style={styles.card}>
              <Text style={styles.name}>🧑 {item.name}</Text>
              <Text style={styles.email}>📧 {item.email}</Text>
              <Text style={[styles.status, { color: isActive ? "green" : "red" }]}>
                {isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9f9f9" },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  name: { fontSize: 18, fontWeight: "bold" },
  email: { fontSize: 14, color: "gray", marginTop: 4 },
  status: { fontSize: 14, marginTop: 6, fontWeight: "bold" },
});
