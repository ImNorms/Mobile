import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { db } from "./firebaseConfig";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useRoute } from "@react-navigation/native";

export default function ElectionStatusScreen() {
  const route = useRoute();
  const { eventId, choices } = route.params || {};
  const [groupedCandidates, setGroupedCandidates] = useState({});
  const [eventTitle, setEventTitle] = useState("");

  useEffect(() => {
    if (!eventId) return;

    // Listen to election data
    const electionRef = doc(db, "elections", eventId);
    const unsubscribeElection = onSnapshot(electionRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      if (data.title) setEventTitle(data.title);

      if (Array.isArray(data.candidates)) {
        const grouped = data.candidates.reduce((acc, candidate, idx) => {
          if (!acc[candidate.position]) acc[candidate.position] = [];
          acc[candidate.position].push({
            ...candidate,
            id: candidate.id || `${candidate.position}_${idx}`,
            voteCount: 0,
            isUserChoice: false,
            isLeader: false,
          });
          return acc;
        }, {});
        setGroupedCandidates(grouped);
      }
    });

    // Listen to votes
    const votesRef = collection(db, "elections", eventId, "votes");
    const unsubscribeVotes = onSnapshot(votesRef, (snap) => {
      const voteCounts = {};

      snap.forEach((voteDoc) => {
        const voteData = voteDoc.data();
        
        // FIX: Access the choices object instead of reading directly from voteData
        const userChoices = voteData.choices || {};
        
        Object.keys(userChoices).forEach((position) => {
          const candidateName = userChoices[position];
          if (!voteCounts[position]) voteCounts[position] = {};
          if (!voteCounts[position][candidateName]) voteCounts[position][candidateName] = 0;

          voteCounts[position][candidateName] += 1;
        });
      });

      setGroupedCandidates((prevGrouped) => {
        const updatedGrouped = { ...prevGrouped };

        Object.keys(updatedGrouped).forEach((position) => {
          updatedGrouped[position] = updatedGrouped[position]
            .map((c) => ({
              ...c,
              voteCount:
                voteCounts[position] && voteCounts[position][c.name]
                  ? voteCounts[position][c.name]
                  : 0,
              isUserChoice: choices && choices[position] === c.name,
            }))
            .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));

          if (updatedGrouped[position].length > 0) {
            const maxVotes = updatedGrouped[position][0].voteCount;
            updatedGrouped[position] = updatedGrouped[position].map((c) => ({
              ...c,
              isLeader: c.voteCount === maxVotes && maxVotes > 0,
            }));
          }
        });

        return updatedGrouped;
      });
    });

    return () => {
      unsubscribeElection();
      unsubscribeVotes();
    };
  }, [eventId, choices]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 {eventTitle || "Live Election Results"}</Text>

      {Object.keys(groupedCandidates).map((position) => (
        <View key={`section_${position}`} style={styles.section}>
          <Text style={styles.sectionTitle}>📌 {position}</Text>

          {groupedCandidates[position].map((candidate, idx) => (
            <View
              key={`${position}_${candidate.id}_${idx}`}
              style={[
                styles.voteRow,
                candidate.isLeader && styles.leaderRow,
                candidate.isUserChoice && styles.userChoiceRow,
              ]}
            >
              <Text style={styles.voteName}>
                {candidate.name} {candidate.isUserChoice ? "(Your Vote)" : ""}
              </Text>
              <Text style={styles.voteCount}>{candidate.voteCount} votes</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9f9f9" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  section: {
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#333" },
  voteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  voteName: { fontSize: 16, color: "#444" },
  voteCount: { fontSize: 16, fontWeight: "bold", color: "#000" },
  leaderRow: { backgroundColor: "#dff0d8" },
  userChoiceRow: { borderWidth: 1, borderColor: "#2980b9" },
});