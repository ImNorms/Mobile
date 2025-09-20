import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Replace this with the actual ID of your election event
const ELECTION_EVENT_ID = "wzGxQO9evW5Pm5DMVrOp";

export default function VotingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Voting</Text>
      </View>

      {/* Menu Cards */}
      <View style={styles.menuContainer}>
        {/* Election Status */}
        <TouchableOpacity
          style={[styles.card, { borderLeftColor: "#00695C" }]}
          onPress={() =>
            navigation.navigate("ElectionStatus", {
              eventId: ELECTION_EVENT_ID, // pass eventId here
            })
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
          onPress={() => navigation.navigate("Elections")}
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
          onPress={() => navigation.navigate("MyVotes")}
        >
          <View style={styles.cardContent}>
            <Ionicons name="clipboard" size={28} color="#FBC02D" />
            <Text style={styles.cardText}>View My Votes</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#FBC02D" />
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Profile")}
        >
          <Ionicons name="person-circle" size={22} color="#fff" />
          <Text style={styles.navText}>Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons name="home" size={22} color="#fff" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Login")}
        >
          <Ionicons name="log-out" size={22} color="#fff" />
          <Text style={styles.navText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4" },
  header: {
    backgroundColor: "#00695C",
    padding: 15,
    alignItems: "center",
  },
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
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#00695C",
    paddingVertical: 10,
  },
  navItem: { alignItems: "center" },
  navText: { fontSize: 12, color: "#fff", marginTop: 2 },
});
