// EventCalendarScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableOpacity,
} from "react-native";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";

export default function EventCalendarScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [selectedDateStr, setSelectedDateStr] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
      const data = snapshot.docs
        .map((doc) => {
          const item = { id: doc.id, ...doc.data() };

          if (item.start?.toDate) {
            item.dateObj = item.start.toDate();
          } else if (item.start) {
            item.dateObj = new Date(item.start + "T00:00:00");
          }

          return item;
        })
        .filter((e) => e.dateObj);

      data.sort((a, b) => a.dateObj - b.dateObj);
      setEvents(data);

      let marks = {};
      const todayStr = new Date().toISOString().split("T")[0];

      data.forEach((event) => {
        const dateStr = event.dateObj.toISOString().split("T")[0];
        marks[dateStr] = {
          marked: true,
          dotColor: dateStr === todayStr ? "orange" : "#1abc9c",
        };
      });

      setMarkedDates(marks);
    });

    return () => unsubscribe();
  }, []);

  const renderEvent = ({ item }) => {
    const eventDate = item.dateObj;
    if (!eventDate) return null;

    const month = eventDate
      .toLocaleString("default", { month: "short" })
      .toUpperCase();
    const day = eventDate.getDate();

    return (
      <View style={styles.eventCard}>
        <View style={styles.dateBox}>
          <Text style={styles.monthText}>{month}</Text>
          <Text style={styles.dayText}>{day}</Text>
        </View>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventTime}>
            {item.startTime} - {item.endTime}
          </Text>
        </View>
      </View>
    );
  };

  const onDayPress = (day) => {
    const eventsForDay = events.filter(
      (e) => e.dateObj.toISOString().split("T")[0] === day.dateString
    );

    if (eventsForDay.length > 0) {
      setSelectedDateEvents(eventsForDay);
      setSelectedDateStr(day.dateString);
      setModalVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Unified FlatList for Calendar + Events */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={{ padding: 10, paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            <Calendar
              markedDates={markedDates}
              onDayPress={onDayPress}
              theme={{
                todayTextColor: "#e74c3c",
                arrowColor: "#34495e",
              }}
              style={styles.calendar}
            />
            <Text style={styles.upcomingTitle}>Upcoming Events</Text>
          </>
        }
      />

      {/* Footer */}
      <View style={styles.footer}>
      <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
        <Ionicons name="person-circle" size={22} color="#fff" />
        <Text style={styles.footerText}>Account</Text>
      </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Ionicons name="home" size={22} color="#fff" />
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.replace("Login")}>
          <Ionicons name="log-out" size={22} color="#fff" />
          <Text style={styles.footerText}>Log out</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Events on {selectedDateStr}</Text>
            {selectedDateEvents.map((event) => (
              <View key={event.id} style={styles.modalEvent}>
                <Text style={styles.modalEventTitle}>{event.title}</Text>
                <Text style={styles.modalEventTime}>
                  {event.startTime} - {event.endTime}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  calendar: { borderRadius: 8, elevation: 3, marginBottom: 15 },
  upcomingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2c3e50",
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#ecf0f1",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  dateBox: {
    width: 50,
    height: 50,
    backgroundColor: "#1abc9c",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  monthText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  dayText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  eventInfo: { flex: 1, justifyContent: "center" },
  eventTitle: { fontSize: 16, fontWeight: "600", color: "#34495e" },
  eventTime: { fontSize: 14, color: "#7f8c8d" },

  // Modal
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    width: width * 0.8,
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  modalEvent: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  modalEventTitle: { fontSize: 14, fontWeight: "600" },
  modalEventTime: { fontSize: 12, color: "#7f8c8d" },
  closeButton: {
    backgroundColor: "#1abc9c",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },

  // Footer
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
