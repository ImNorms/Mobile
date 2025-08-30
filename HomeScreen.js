import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Homepage</Text>
      <Text style={styles.greeting}>Hello, (User name)</Text>

      {/* Banner */}
      <Image 
        source={{ uri: "https://picsum.photos/400/200" }} 
        style={styles.banner} 
      />

      {/* Grid Buttons */}
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.card, { backgroundColor: "#3498db" }]} onPress={() => navigation.navigate("Announcement")}>
          <Text style={styles.cardText}>📢 Announcement</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: "#27ae60" }]} onPress={() => navigation.navigate("EventCalendar")}>
          <Text style={styles.cardText}>📅 Event Calendar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: "#2980b9" }]} onPress={() => navigation.navigate("Accounting")}>
          <Text style={styles.cardText}>💰 Accounting</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: "#e74c3c" }]} onPress={() => navigation.navigate("Complaints")}>
          <Text style={styles.cardText}>⚠️ Complaints</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: "#f39c12" }]} onPress={() => navigation.navigate("Committee")}>
          <Text style={styles.cardText}>👥 Committee</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: "#8e44ad" }]} onPress={() => navigation.navigate("Members")}>
          <Text style={styles.cardText}>🧑 Members</Text>
        </TouchableOpacity>
      </View>

      {/* Footer Nav (Account, Home, Logout) */}
      <View style={styles.footer}>
        <TouchableOpacity><Text style={styles.footerText}>👤 Account</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.footerText}>🏠 Home</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.replace("Login")}><Text style={styles.footerText}>🚪 Logout</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4", padding: 15 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 5 },
  greeting: { fontSize: 16, marginBottom: 15 },
  banner: { width: "100%", height: 180, borderRadius: 10, marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: {
    width: "48%",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { color: "#fff", fontWeight: "bold", fontSize: 16, textAlign: "center" },
  footer: { flexDirection: "row", justifyContent: "space-around", marginTop: 30, paddingVertical: 15, backgroundColor: "#2c3e50", borderRadius: 10 },
  footerText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
});
