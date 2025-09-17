import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerBox}>
          <Text style={styles.header}>Homepage</Text>
          <Text style={styles.greeting}>Hello, (User name)</Text>
        </View>

        {/* Banner */}
        <View style={styles.bannerBox}>
          <Image
            source={{ uri: "https://picsum.photos/400/200" }}
            style={styles.banner}
          />
          <TouchableOpacity style={styles.bannerButton}>
            <Text style={styles.bannerText}>View all post</Text>
          </TouchableOpacity>
        </View>

        {/* Grid Buttons */}
        <View style={styles.grid}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: "#0083B0" }]}
            onPress={() => navigation.navigate("Announcement")}
          >
            <Ionicons name="megaphone" size={28} color="#fff" />
            <Text style={styles.cardText}>Announcement</Text>
            <Text style={styles.smallText}>View all</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: "#0EAD69" }]}
            onPress={() => navigation.navigate("EventCalendar")}
          >
            <Ionicons name="calendar" size={28} color="#fff" />
            <Text style={styles.cardText}>Event Calendar</Text>
            <Text style={styles.smallText}>View Events</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: "#005f99" }]}
            onPress={() => navigation.navigate("Accounting")}
          >
            <Ionicons name="wallet" size={28} color="#fff" />
            <Text style={styles.cardText}>Accounting</Text>
            <Text style={styles.smallText}>Check Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: "#E74C3C" }]}
            onPress={() => navigation.navigate("Complaints")}
          >
            <Ionicons name="warning" size={28} color="#fff" />
            <Text style={styles.cardText}>Complaints</Text>
            <Text style={styles.smallText}>+ File a complaint</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: "#F39C12" }]}
            onPress={() => navigation.navigate("Committee")}
          >
            <Ionicons name="people" size={28} color="#fff" />
            <Text style={styles.cardText}>Committee</Text>
            <Text style={styles.smallText}>View all</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: "#8E44AD" }]}
            onPress={() => navigation.navigate("Members")}
          >
            <Ionicons name="person" size={28} color="#fff" />
            <Text style={styles.cardText}>Members</Text>
            <Text style={styles.smallText}>View all</Text>
          </TouchableOpacity>

          {/* ✅ New Voting Button */}
          <TouchableOpacity
            style={[styles.card, { backgroundColor: "#2C3E50" }]}
            onPress={() => navigation.navigate("Voting")}
          >
            <Ionicons name="checkmark-circle" size={28} color="#fff" />
            <Text style={styles.cardText}>Voting</Text>
            <Text style={styles.smallText}>Vote now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer Nav */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person-circle" size={22} color="#fff" />
          <Text style={styles.footerText}>Account</Text>
        </TouchableOpacity>
        <TouchableOpacity>
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
  container: { flex: 1, backgroundColor: "#f4f4f4" },
  scrollContent: { paddingBottom: 100 }, // space for footer
  headerBox: { padding: 15, backgroundColor: "#00695C" },
  header: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  greeting: { fontSize: 14, color: "#fff", marginTop: 2 },

  bannerBox: { position: "relative", margin: 15 },
  banner: { width: "100%", height: 180, borderRadius: 10 },
  bannerButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bannerText: { color: "#fff", fontSize: 12 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 15,
  },
  card: {
    width: "48%",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
  },
  smallText: { color: "#fff", fontSize: 12, marginTop: 3 },

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
  footerText: { color: "#fff", fontSize: 12, marginTop: 3, textAlign: "center" },
});
