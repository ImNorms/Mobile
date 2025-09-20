import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { db } from "./firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";

export default function ElectionsScreen() {
  const [elections, setElections] = useState({});
  const [eventInfo, setEventInfo] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [selectedChoices, setSelectedChoices] = useState({});
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const navigation = useNavigation();

  // Fetch election data
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "elections"), (snap) => {
      let grouped = {};
      let eventFields = null;
      let firstEventId = null;

      snap.forEach((docSnap) => {
        firstEventId = docSnap.id;
        const data = docSnap.data();

        eventFields = {
          title: data.title,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          createdAt: data.createdAt,
        };

        if (Array.isArray(data.candidates)) {
          data.candidates.forEach((candidate, index) => {
            if (!grouped[candidate.position]) grouped[candidate.position] = [];
            grouped[candidate.position].push({
              ...candidate,
              id: candidate.id || `${docSnap.id}_${index}`,
            });
          });
        }
      });

      setElections(grouped);
      setEventInfo(eventFields);
      setEventId(firstEventId);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Submit votes dynamically
  const handleSubmitAllVotes = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to vote.");
        return;
      }

      if (!eventId) {
        alert("Election event not found.");
        return;
      }

      const positions = Object.keys(selectedChoices);
      if (positions.length === 0) {
        alert("Please select at least one candidate before submitting.");
        return;
      }

      const voteRef = doc(db, "elections", eventId, "votes", user.uid);
      const existingVote = await getDoc(voteRef);
      if (existingVote.exists()) {
        alert("⚠️ You have already submitted your vote.");
        return;
      }

      // Map selected candidate IDs to their names dynamically
      const votesByName = {};
      positions.forEach((position) => {
        const candidateId = selectedChoices[position];
        const candidate = elections[position].find((c) => c.id === candidateId);
        if (candidate) {
          votesByName[position] = candidate.name; // or candidate.id if you prefer saving ID
        }
      });

      await setDoc(voteRef, {
        userId: user.uid,
        choices: votesByName,
        timestamp: serverTimestamp(),
      });

      alert("✅ Your votes have been submitted!");

      navigation.navigate("ElectionStatus", {
        eventId: eventId,
        choices: votesByName,
      });
    } catch (error) {
      console.error("Error submitting votes: ", error);
      alert("Error submitting votes.");
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
      <ScrollView>
        {eventInfo && (
          <View style={styles.eventCard}>
            <Text style={styles.eventTitle}>{eventInfo.title}</Text>
            {eventInfo.date && (
              <Text style={styles.eventDetail}>📅 Date: {eventInfo.date}</Text>
            )}
            {eventInfo.startTime && eventInfo.endTime && (
              <Text style={styles.eventDetail}>
                🕒 Time: {eventInfo.startTime} - {eventInfo.endTime}
              </Text>
            )}
          </View>
        )}

        {Object.keys(elections).map((position) => (
          <View key={position} style={styles.section}>
            <Text style={styles.sectionTitle}>{position}</Text>

            <FlatList
              data={elections[position]}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const isSelected = selectedChoices[position] === item.id;

                return (
                  <TouchableOpacity
                    style={[
                      styles.card,
                      isSelected && { borderColor: "#2980b9", borderWidth: 2 },
                    ]}
                    onPress={() =>
                      setSelectedChoices((prev) => {
                        if (prev[position] === item.id) {
                          const updated = { ...prev };
                          delete updated[position];
                          return updated;
                        } else {
                          return {
                            ...prev,
                            [position]: item.id,
                          };
                        }
                      })
                    }
                  >
                    {item.photoURL ? (
                      <Image
                        source={{ uri: item.photoURL }}
                        style={styles.image}
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Text style={styles.initial}>{item.name?.charAt(0)}</Text>
                      </View>
                    )}

                    <View style={styles.info}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.term}>Position: {item.position}</Text>
                      {item.termDuration && (
                        <Text style={styles.term}>Term: {item.termDuration}</Text>
                      )}
                    </View>

                    <Text style={styles.radio}>{isSelected ? "🔘" : "⚪"}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        ))}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmitAllVotes}
        >
          <Text style={styles.submitText}>Submit All Votes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4", padding: 10 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  eventCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
  },
  eventTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  eventDetail: { fontSize: 14, color: "#555", marginBottom: 3 },

  section: { marginBottom: 25 },
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
  term: { fontSize: 12, color: "#777" },
  radio: { fontSize: 20, marginLeft: 10 },
  submitButton: {
    backgroundColor: "#2C3E50",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
