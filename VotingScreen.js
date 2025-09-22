import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "./firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";

export default function VotingScreen({ navigation }) {
  const [firstElectionId, setFirstElectionId] = useState(null);

  useEffect(() => {
    // Listen for elections and get the first one
    const unsubscribe = onSnapshot(collection(db, "elections"), (snap) => {
      if (!snap.empty) {
        setFirstElectionId(snap.docs[0].id);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Voting</Text>
      </View>

      <View style={styles.menuContainer}>
        {/* Election Status */}
        <TouchableOpacity
          style={[styles.card, { borderLeftColor: "#00695C" }]}
          onPress={() =>
            firstElectionId &&
            navigation.navigate("ElectionStatus", { eventId: firstElectionId })
          }
        >
          <View style={styles.cardContent}>
            <Ionicons name="stats-chart" size={28} color="#00695C" />
            <Text style={styles.cardText}>Election Status</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#00695C" />
        </TouchableOpacity>

        {/* Board of Directors Election */}
        <TouchableOpacity
          style={[styles.card, { borderLeftColor: "#2E7D32" }]}
          onPress={() =>
            firstElectionId && navigation.navigate("Elections", { eventId: firstElectionId })
          }
        >
          <View style={styles.cardContent}>
            <Ionicons name="people" size={28} color="#2E7D32" />
            <Text style={styles.cardText}>Board of Directors Election</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#2E7D32" />
        </TouchableOpacity>

        {/* View My Votes */}
        <TouchableOpacity
          style={[styles.card, { borderLeftColor: "#FBC02D" }]}
          onPress={() =>
            firstElectionId && navigation.navigate("MyVotes", { eventId: firstElectionId })
          }
        >
          <View style={styles.cardContent}>
            <Ionicons name="clipboard" size={28} color="#FBC02D" />
            <Text style={styles.cardText}>View My Votes</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#FBC02D" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4" },
  header: { backgroundColor: "#00695C", padding: 15, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  menuContainer: { flex: 1, padding: 10 },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 6,
    elevation: 2,
  },
  cardContent: { flexDirection: "row", alignItems: "center" },
  cardText: { marginLeft: 10, fontSize: 15, fontWeight: "600", color: "#333" },
});
