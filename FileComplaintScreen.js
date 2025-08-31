// FileComplaintScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { getAuth } from "firebase/auth";
import { db } from "./firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function FileComplaintScreen({ navigation }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [complaint, setComplaint] = useState("");

  const handleSubmit = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "You must be logged in to file a complaint.");
      return;
    }

    if (!name || !contact || !address || !complaint) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      await addDoc(collection(db, "complaints"), {
        userId: user.uid,
        name,
        contact,
        address,
        complaint,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      Alert.alert("Success", "Your complaint has been filed.");
      navigation.goBack();
    } catch (error) {
      console.error("Error adding complaint: ", error);
      Alert.alert("Error", "Could not file complaint.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>File a Complaint</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Contact Number"
        value={contact}
        onChangeText={setContact}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
      />

      <TextInput
        style={[styles.input, { height: 120 }]}
        placeholder="Enter your complaint"
        value={complaint}
        onChangeText={setComplaint}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Complaint</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
