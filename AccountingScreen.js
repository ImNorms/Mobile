import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export default function AccountingScreen() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "contributions"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setContributions(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching contributions:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (contributions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No contributions found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💰 My Contributions</Text>
      <FlatList
        data={contributions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.name || "Unnamed Contribution"}</Text>
            <Text style={styles.amount}>Amount: ₱{item.amount || 0}</Text>
            <Text style={styles.date}>Date: {item.date || "N/A"}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 16 },
  item: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: "bold" },
  amount: { fontSize: 14 },
  date: { fontSize: 12, color: "gray" },
  text: { fontSize: 16, color: "gray" },
});
