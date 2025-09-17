import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { db } from "./firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function VotingScreen() {
  const [candidates, setCandidates] = useState({});
  const [userVotes, setUserVotes] = useState({}); // track user’s votes
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  // Fetch candidates and group by position
  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "candidates"));
        const grouped = {};
        querySnapshot.forEach((docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data() };
          if (!grouped[data.position]) grouped[data.position] = [];
          grouped[data.position].push(data);
        });
        setCandidates(grouped);

        // Fetch current user votes
        const user = auth.currentUser;
        if (user) {
          const votes = {};
          for (const position of Object.keys(grouped)) {
            const q = query(
              collection(db, "candidates"),
              where("position", "==", position)
            );
            const snapshot = await getDocs(q);
            for (const candidateDoc of snapshot.docs) {
              const voteSnap = await getDocs(
                collection(db, `candidates/${candidateDoc.id}/votes`)
              );
              if (voteSnap.docs.find((d) => d.id === user.uid)) {
                votes[position] = candidateDoc.id;
              }
            }
          }
          setUserVotes(votes);
        }
      } catch (error) {
        console.error("Error fetching candidates or votes: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle voting per category (position)
  const handleVote = async (candidateId, position) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to vote.");
        return;
      }

      // If the user already voted in this position, remove old vote
      if (userVotes[position] && userVotes[position] !== candidateId) {
        const oldVoteRef = doc(
          db,
          "candidates",
          userVotes[position],
          "votes",
          user.uid
        );
        await deleteDoc(oldVoteRef);
      }

      // Add new vote
      const voteRef = doc(db, "candidates", candidateId, "votes", user.uid);
      await setDoc(voteRef, {
        userId: user.uid,
        position,
        timestamp: serverTimestamp(),
      });

      setUserVotes((prev) => ({ ...prev, [position]: candidateId }));
      alert("Vote updated successfully!");
    } catch (error) {
      console.error("Error casting vote: ", error);
      alert("Error casting vote.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#00695C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Object.keys(candidates).map((position) => (
        <View key={position} style={styles.section}>
          <Text style={styles.sectionTitle}>{position}</Text>
          <FlatList
            data={candidates[position]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isVoted = userVotes[position] === item.id;
              return (
                <View
                  style={[
                    styles.card,
                    isVoted && { borderColor: "#2C3E50", borderWidth: 2 },
                  ]}
                >
                  {/* Candidate Image */}
                  {item.photoURL ? (
                    <Image source={{ uri: item.photoURL }} style={styles.image} />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Text style={styles.initial}>{item.name?.charAt(0)}</Text>
                    </View>
                  )}

                  {/* Candidate Info */}
                  <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                    <Text style={styles.term}>Term: {item.termDuration}</Text>
                    <Text style={styles.contact}>Contact: {item.contactNo}</Text>

                    {/* ✅ Vote Count */}
                    <Text style={styles.voteCount}>
                      Votes: {item.voteCount ?? 0}
                    </Text>
                  </View>

                  {/* Vote Button */}
                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      isVoted && { backgroundColor: "#27ae60" },
                    ]}
                    onPress={() => handleVote(item.id, item.position)}
                  >
                    <Text style={styles.voteText}>
                      {isVoted ? "Voted" : "Vote"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4", padding: 10 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  image: { width: 60, height: 60, borderRadius: 30 },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  initial: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  info: { flex: 1, marginLeft: 15 },
  name: { fontSize: 16, fontWeight: "bold" },
  email: { fontSize: 12, color: "#777" },
  term: { fontSize: 12, color: "#777" },
  contact: { fontSize: 12, color: "#777" },
  voteCount: { fontSize: 13, fontWeight: "bold", marginTop: 5, color: "#2C3E50" },
  voteButton: {
    backgroundColor: "#2C3E50",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  voteText: { color: "#fff", fontWeight: "bold" },
});
