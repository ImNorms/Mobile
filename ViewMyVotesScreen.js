import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { db } from "./firebaseConfig";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function MyVotesScreen() {
  const [myVotes, setMyVotes] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const user = auth.currentUser;
  const eventId = "wzGxQO9evW5Pm5DMVrOp"; // 🔑 replace with dynamic event if needed

  useEffect(() => {
    const fetchVotesAndCandidates = async () => {
      try {
        if (!user) return;

        // ✅ Get user's votes
        const voteRef = doc(db, "elections", eventId, "votes", user.uid);
        const voteSnap = await getDoc(voteRef);

        if (voteSnap.exists()) {
          setMyVotes(voteSnap.data().choices || {});
        }

        // ✅ Get election candidates
        const electionRef = doc(db, "elections", eventId);
        const electionSnap = await getDoc(electionRef);

        if (electionSnap.exists()) {
          setCandidates(electionSnap.data().candidates || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVotesAndCandidates();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00695C" />
      </View>
    );
  }

  if (!myVotes || Object.keys(myVotes).length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>⚠️ You have not voted yet.</Text>
      </View>
    );
  }

  // ✅ Build array: [{ position, candidate }] - only for positions you voted for
  const votesArray = Object.entries(myVotes)
    .map(([position, candidateName]) => {
      // Find candidate by name (not ID, since you're storing names in votes)
      const candidate = candidates.find((c) => c.name === candidateName);
      return { position, candidate, candidateName };
    })
    .filter(item => item.candidate); // Only include votes where we found the candidate

  if (votesArray.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>⚠️ No matching candidates found for your votes.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗳 My Votes ({votesArray.length})</Text>

      <FlatList
        data={votesArray}
        keyExtractor={(item) => item.position}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.candidate?.photoURL ? (
              <Image source={{ uri: item.candidate.photoURL }} style={styles.image} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.initial}>
                  {item.candidate?.name?.charAt(0) || "?"}
                </Text>
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.position}>📌 {item.position}</Text>
              <Text style={styles.name}>
                {item.candidate?.name || item.candidateName}
              </Text>
              {item.candidate?.termDuration && (
                <Text style={styles.term}>
                  Term: {item.candidate.termDuration}
                </Text>
              )}
            </View>
            <Text style={styles.checkmark}>✅</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f4f4f4" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2C3E50",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#27AE60",
  },
  image: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  initial: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  info: { flex: 1 },
  position: { fontSize: 16, fontWeight: "bold", color: "#2C3E50" },
  name: { fontSize: 16, color: "#333", marginTop: 2 },
  term: { fontSize: 12, color: "#777", marginTop: 2 },
  error: { fontSize: 16, color: "red", textAlign: "center" },
  checkmark: { fontSize: 20, color: "#27AE60", marginLeft: 10 },
});