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
  Alert,
  useWindowDimensions,
} from "react-native";
import { collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const responsiveSize = (size) => {
  const scale = SCREEN_WIDTH / 375;
  return Math.round(size * Math.min(scale, 1.5));
};

export default function EventCalendarScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [selectedDateStr, setSelectedDateStr] = useState("");

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isSmallScreen = width < 375;
  const isTablet = width > 768;

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

      const today = new Date();
      const upcoming = [];
      const past = [];

      data.forEach((event) => {
        if (event.dateObj >= today) {
          upcoming.push(event);
        } else {
          past.push(event);
        }
      });

      upcoming.sort((a, b) => a.dateObj - b.dateObj);
      past.sort((a, b) => b.dateObj - a.dateObj);

      const sortedData = [...upcoming, ...past];
      setEvents(sortedData);

      let marks = {};
      const todayStr = today.toISOString().split("T")[0];
      sortedData.forEach((event) => {
        const dateStr = event.dateObj.toISOString().split("T")[0];
        marks[dateStr] = {
          marked: true,
          dotColor: dateStr === todayStr ? "orange" : "#00695C",
        };
      });

      setMarkedDates(marks);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert("Logout failed", error.message);
    }
  };

  const renderEvent = ({ item }) => {
    const eventDate = item.dateObj;
    if (!eventDate) return null;

    const month = eventDate
      .toLocaleString("default", { month: "short" })
      .toUpperCase();
    const day = eventDate.getDate();

    return (
      <View
        style={[
          styles.eventCard,
          isLandscape && styles.landscapeEventCard,
          isSmallScreen && styles.smallEventCard,
        ]}
      >
        <View
          style={[
            styles.dateBox,
            isSmallScreen && styles.smallDateBox,
            isTablet && styles.tabletDateBox,
          ]}
        >
          <Text
            style={[
              styles.monthText,
              isSmallScreen && styles.smallMonthText,
              isTablet && styles.tabletMonthText,
            ]}
          >
            {month}
          </Text>
          <Text
            style={[
              styles.dayText,
              isSmallScreen && styles.smallDayText,
              isTablet && styles.tabletDayText,
            ]}
          >
            {day}
          </Text>
        </View>
        <View style={[styles.eventInfo, isSmallScreen && styles.smallEventInfo]}>
          <Text
            style={[
              styles.eventTitle,
              isSmallScreen && styles.smallEventTitle,
              isTablet && styles.tabletEventTitle,
            ]}
          >
            {item.title}
          </Text>
          <Text
            style={[
              styles.eventTime,
              isSmallScreen && styles.smallEventTime,
              isTablet && styles.tabletEventTime,
            ]}
          >
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
      <View
        style={[
          styles.header,
          isLandscape && styles.landscapeHeader,
          isTablet && styles.tabletHeader,
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            isSmallScreen && styles.smallHeaderTitle,
            isTablet && styles.tabletHeaderTitle,
          ]}
        >
          Event Calendar
        </Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={[
          styles.listContent,
          isLandscape && styles.landscapeListContent,
          isTablet && styles.tabletListContent,
        ]}
        ListHeaderComponent={
          <>
            <View
              style={[
                styles.calendarContainer,
                isLandscape && styles.landscapeCalendarContainer,
                isTablet && styles.tabletCalendarContainer,
              ]}
            >
              <Calendar
                markedDates={markedDates}
                onDayPress={onDayPress}
                theme={{
                  todayTextColor: "#FF6B35",
                  arrowColor: "#00695C",
                  selectedDayBackgroundColor: "#00695C",
                  selectedDayTextColor: "#ffffff",
                  textMonthFontWeight: "bold",
                  monthTextColor: "#1e293b",
                  textDayHeaderFontWeight: "600",
                  textDayFontSize: isSmallScreen
                    ? responsiveSize(14)
                    : responsiveSize(16),
                  textMonthFontSize: isSmallScreen
                    ? responsiveSize(16)
                    : responsiveSize(18),
                  textDayHeaderFontSize: isSmallScreen
                    ? responsiveSize(12)
                    : responsiveSize(14),
                }}
                style={styles.calendar}
              />
            </View>
            <Text
              style={[
                styles.upcomingTitle,
                isSmallScreen && styles.smallUpcomingTitle,
                isTablet && styles.tabletUpcomingTitle,
              ]}
            >
              Upcoming Events
            </Text>
          </>
        }
      />

      <View
        style={[
          styles.footer,
          isLandscape && styles.landscapeFooter,
          isTablet && styles.tabletFooter,
        ]}
      >
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => navigation.navigate("Profile")}
        >
          <Ionicons
            name="person-circle"
            size={isSmallScreen ? responsiveSize(20) : responsiveSize(24)}
            color="#fff"
          />
          <Text style={styles.footerText}>Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons
            name="home"
            size={isSmallScreen ? responsiveSize(20) : responsiveSize(24)}
            color="#fff"
          />
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton} onPress={handleLogout}>
          <Ionicons
            name="log-out"
            size={isSmallScreen ? responsiveSize(20) : responsiveSize(24)}
            color="#fff"
          />
          <Text style={styles.footerText}>Log out</Text>
        </TouchableOpacity>
      </View>

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
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    backgroundColor: "#00695C",
    paddingTop: responsiveSize(50),
    paddingBottom: responsiveSize(16),
    paddingHorizontal: Math.max(responsiveSize(20), 16),
    borderBottomLeftRadius: responsiveSize(25),
    borderBottomRightRadius: responsiveSize(25),
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    minHeight: responsiveSize(100),
  },
  headerTitle: {
    color: "#fff",
    fontSize: responsiveSize(22),
    fontWeight: "bold",
    textAlign: "center",
  },
  smallHeaderTitle: { fontSize: responsiveSize(20) },
  tabletHeaderTitle: { fontSize: responsiveSize(26) },

  upcomingTitle: {
    fontSize: responsiveSize(18),
    fontWeight: "600",
    marginBottom: responsiveSize(12),
    color: "#1e293b",
  },
  smallUpcomingTitle: { fontSize: responsiveSize(16) },
  tabletUpcomingTitle: { fontSize: responsiveSize(20) },

  listContent: {
    padding: Math.max(responsiveSize(20), 16),
    paddingBottom: responsiveSize(100),
  },
  calendarContainer: {
    backgroundColor: "#fff",
    borderRadius: responsiveSize(16),
    padding: Math.max(responsiveSize(16), 12),
    elevation: 4,
    marginBottom: responsiveSize(20),
  },
  calendar: { borderRadius: responsiveSize(12) },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: responsiveSize(16),
    borderRadius: responsiveSize(12),
    marginBottom: responsiveSize(12),
    elevation: 2,
    borderLeftWidth: responsiveSize(4),
    borderLeftColor: "#00695C",
    minHeight: responsiveSize(80),
  },
  dateBox: {
    width: responsiveSize(60),
    height: responsiveSize(60),
    backgroundColor: "#00695C",
    borderRadius: responsiveSize(12),
    justifyContent: "center",
    alignItems: "center",
    marginRight: responsiveSize(16),
  },
  monthText: { color: "#fff", fontWeight: "bold", fontSize: responsiveSize(14) },
  dayText: { color: "#fff", fontWeight: "bold", fontSize: responsiveSize(20) },
  eventInfo: { flex: 1, justifyContent: "center" },
  eventTitle: {
    fontSize: responsiveSize(18),
    fontWeight: "bold",
    color: "#1e293b",
  },
  eventTime: { fontSize: responsiveSize(16), color: "#64748b" },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    width: "90%",
    maxWidth: 400,
    borderRadius: responsiveSize(16),
    padding: responsiveSize(24),
  },
  modalTitle: {
    fontSize: responsiveSize(20),
    fontWeight: "bold",
    marginBottom: responsiveSize(16),
    textAlign: "center",
  },
  modalEvent: {
    paddingVertical: responsiveSize(12),
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalEventTitle: {
    fontSize: responsiveSize(16),
    fontWeight: "600",
    color: "#1e293b",
  },
  modalEventTime: { fontSize: responsiveSize(14), color: "#64748b" },
  closeButton: {
    backgroundColor: "#00695C",
    padding: responsiveSize(14),
    borderRadius: responsiveSize(12),
    marginTop: responsiveSize(16),
    alignItems: "center",
  },
  closeButtonText: { color: "#fff", fontWeight: "bold", fontSize: responsiveSize(16) },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: responsiveSize(16),
    backgroundColor: "#004d40",
    borderTopLeftRadius: responsiveSize(20),
    borderTopRightRadius: responsiveSize(20),
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
  },
  footerButton: { alignItems: "center" },
  footerText: {
    color: "#fff",
    fontSize: responsiveSize(12),
    marginTop: responsiveSize(4),
    textAlign: "center",
  },
});
