// #
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { db } from "./firebaseConfig";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useRoute } from "@react-navigation/native";

export default function ElectionStatusScreen() {
  const route = useRoute();
  const { eventId, votes: userVotes } = route.params || {};
  const [groupedCandidates, setGroupedCandidates] = useState({});
  const [eventTitle, setEventTitle] = useState("");

  useEffect(() => {
    if (!eventId) return;

    // Listen to election info
    const electionRef = doc(db, "elections", eventId);
    const unsubscribeElection = onSnapshot(electionRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      if (data.title) setEventTitle(data.title);
    });

    // Listen to candidates subcollection
    const candidatesRef = collection(db, "elections", eventId, "candidates");
    const unsubscribeCandidates = onSnapshot(candidatesRef, (snap) => {
      const grouped = {};

      snap.forEach((candidateDoc) => {
        const candidateData = candidateDoc.data();
        if (!grouped[candidateData.position]) grouped[candidateData.position] = [];
        grouped[candidateData.position].push({
          ...candidateData,
          id: candidateDoc.id,
          voteCount: 0,
          isUserChoice: false,
          isLeader: false,
        });
      });

      setGroupedCandidates(grouped);
    });

    // Listen to votes
    const votesRef = collection(db, "votes");
    const unsubscribeVotes = onSnapshot(votesRef, (snap) => {
      const voteCounts = {};

      snap.forEach((voteDoc) => {
        const voteData = voteDoc.data();
        if (voteData.eventId !== eventId) return; // only count this election

        const userChoices = voteData.votes || {};
        Object.keys(userChoices).forEach((position) => {
          const candidateId = userChoices[position]?.candidateId;
          if (!candidateId) return;

          if (!voteCounts[position]) voteCounts[position] = {};
          if (!voteCounts[position][candidateId]) voteCounts[position][candidateId] = 0;

          voteCounts[position][candidateId] += 1;
        });
      });

      // Update groupedCandidates with vote counts
      setGroupedCandidates((prevGrouped) => {
        const updatedGrouped = { ...prevGrouped };

        Object.keys(updatedGrouped).forEach((position) => {
          updatedGrouped[position] = updatedGrouped[position]
            .map((c) => ({
              ...c,
              voteCount: voteCounts[position]?.[c.id] || 0,
              isUserChoice: userVotes?.[position]?.candidateId === c.id,
            }))
            .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));

          // Mark leader(s)
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
      unsubscribeCandidates();
      unsubscribeVotes();
    };
  }, [eventId, userVotes]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{eventTitle || "Election Results"}</Text>
        <Text style={styles.subtitle}>Live Voting Count</Text>
      </View>

      {Object.keys(groupedCandidates).map((position) => (
        <View key={position} style={styles.positionSection}>
          <View style={styles.positionHeader}>
            <Text style={styles.positionTitle}>HOA {position}</Text>
          </View>
          
          <View style={styles.votingCountHeader}>
            <Text style={styles.yearText}>2025</Text>
            <Text style={styles.votingCountText}>Voting Count</Text>
          </View>

          {groupedCandidates[position].map((candidate, idx) => {
            const isTop = idx === 0 && candidate.voteCount > 0;
            
            return (
              <View
                key={`${position}_${candidate.id}_${idx}`}
                style={[
                  styles.candidateCard,
                  candidate.isUserChoice && styles.userChoiceCard,
                  isTop && styles.topCandidateCard,
                ]}
              >
                <View style={styles.candidateLeft}>
                  <View style={styles.avatarContainer}>
                    {candidate.photoURL ? (
                      <Image
                        source={{ uri: candidate.photoURL }}
                        style={styles.avatar}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                          {candidate.name?.charAt(0)?.toUpperCase() || "?"}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.candidateInfo}>
                    <Text style={styles.candidateName}>
                      {candidate.name}
                      {candidate.isUserChoice && " (Your Vote)"}
                    </Text>
                    {candidate.isLeader && candidate.voteCount > 0 && (
                      <Text style={styles.leaderBadge}>Leading</Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.voteSection}>
                  <Text style={styles.voteNumber}>{candidate.voteCount}</Text>
                  <Text style={styles.voteLabel}>
                    {candidate.voteCount === 1 ? "Vote" : "Votes"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1976D2",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  positionSection: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  positionHeader: {
    backgroundColor: "#00796B",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  positionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  votingCountHeader: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  yearText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  votingCountText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  candidateCard: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  userChoiceCard: {
    backgroundColor: "#e3f2fd",
    borderLeftWidth: 4,
    borderLeftColor: "#1976D2",
  },
  topCandidateCard: {
    backgroundColor: "#f1f8e9",
    borderLeftWidth: 4,
    borderLeftColor: "#4caf50",
  },
  candidateLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  leaderBadge: {
    fontSize: 12,
    color: "#4caf50",
    fontWeight: "600",
  },
  voteSection: {
    alignItems: "center",
    minWidth: 60,
  },
  voteNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1976D2",
  },
  voteLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});
