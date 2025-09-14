// FileComplaintScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { getAuth } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { db } from "./firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

export default function FileComplaintScreen({ navigation }) {
  const [name, setName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [address, setAddress] = useState("");
  const [complaint, setComplaint] = useState("");

  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const auth = getAuth();
  const storage = getStorage();

  const getFileNameFromUri = (uri) => {
    try {
      const lastSlash = uri.lastIndexOf("/");
      return lastSlash >= 0
        ? decodeURIComponent(uri.substring(lastSlash + 1))
        : `file_${Date.now()}`;
    } catch {
      return `file_${Date.now()}`;
    }
  };

  const uploadFile = async (uri) => {
    if (!auth.currentUser) throw new Error("User not logged in");
    const userId = auth.currentUser.uid;

    const fileName = getFileNameFromUri(uri);
    const storageRef = ref(storage, `complaints/${userId}/${fileName}`);

    const resp = await fetch(uri);
    const blob = await resp.blob();

    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    return { url: downloadUrl, name: fileName };
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "We need access to your photo library to attach images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) throw new Error("No image URI returned");

      setUploading(true);
      const uploaded = await uploadFile(asset.uri);
      setAttachments((prev) => [...prev, uploaded]);
    } catch (e) {
      console.error("pickImage error:", e);
      Alert.alert(
        "Attach Image Failed",
        e.message || "Something went wrong while attaching the image."
      );
    } finally {
      setUploading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0] ?? result;
      const uri = asset.uri;
      if (!uri) throw new Error("No document URI returned");

      setUploading(true);
      const uploaded = await uploadFile(uri);
      setAttachments((prev) => [...prev, uploaded]);
    } catch (e) {
      console.error("pickDocument error:", e);
      Alert.alert(
        "Attach Document Failed",
        e.message || "Something went wrong while attaching the document."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Not signed in", "You must be logged in to file a complaint.");
      return;
    }
    if (!name || !contactNo || !address || !complaint) {
      Alert.alert(
        "Missing info",
        "Please fill in your name, contact no, address, and complaint."
      );
      return;
    }

    try {
      await addDoc(collection(db, "complaints"), {
        userId: user.uid,
        name,
        contactNo,
        address,
        complaint,
        attachments,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Complaint submitted successfully!");
      navigation.goBack();
    } catch (e) {
      console.error("submit complaint error:", e);
      Alert.alert("Error", e.message || "Failed to submit complaint.");
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>File a Complaint</Text>

        <TextInput
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="Contact No."
          value={contactNo}
          onChangeText={setContactNo}
          style={styles.input}
          keyboardType="phone-pad"
        />
        <TextInput
          placeholder="Address"
          value={address}
          onChangeText={setAddress}
          style={styles.input}
        />
        <TextInput
          placeholder="Enter your complaint"
          value={complaint}
          onChangeText={setComplaint}
          style={[styles.input, { height: 110 }]}
          multiline
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.fileButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <Text style={styles.fileButtonText}>
              {uploading ? "Uploading..." : "Attach Image"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fileButton}
            onPress={pickDocument}
            disabled={uploading}
          >
            <Text style={styles.fileButtonText}>
              {uploading ? "Uploading..." : "Attach Document"}
            </Text>
          </TouchableOpacity>
        </View>

        {uploading && (
          <View style={styles.uploadingRow}>
            <ActivityIndicator />
            <Text style={{ marginLeft: 8 }}>Uploading file…</Text>
          </View>
        )}

        {attachments.length > 0 && (
          <View style={styles.attachList}>
            <Text style={styles.attachListTitle}>Attached files:</Text>
            {attachments.map((f, idx) => (
              <Text key={`${f.url}-${idx}`} style={styles.attachItem}>
                • {f.name}
              </Text>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={uploading}
        >
          <Text style={styles.submitText}>Submit Complaint</Text>
        </TouchableOpacity>
      </ScrollView>

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
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20, paddingBottom: 100 }, // space for footer
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  fileButton: {
    backgroundColor: "#6c63ff",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  fileButtonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  uploadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  attachList: {
    marginBottom: 16,
    backgroundColor: "#f6f8ff",
    padding: 12,
    borderRadius: 8,
  },
  attachListTitle: { fontWeight: "700", marginBottom: 6 },
  attachItem: { fontSize: 13 },
  submitButton: { backgroundColor: "green", padding: 15, borderRadius: 10 },
  submitText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
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
  footerText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 3,
    textAlign: "center",
  },
});
