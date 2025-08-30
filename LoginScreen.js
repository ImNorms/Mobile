// LoginScreen.js
import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ✅ Firebase imports
import { auth } from './firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ Login with Firebase
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in:", userCredential.user.email);

      // Navigate to Home screen with user info
      navigation.replace("Home", { userEmail: userCredential.user.email });
    } catch (error) {
      console.error("Login error:", error.message);
      Alert.alert("Login Failed", error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Welcome Section */}
      <View style={styles.header}>
        <Text style={styles.welcomeTitle}>WELCOME{"\n"}TO HOA MIS</Text>
        <Text style={styles.welcomeSubtitle}>
          Welcome to the Management {"\n"}System of the SMUMHOA Inc.
        </Text>
        {/* Logo */}
        <Image source={require("./assets/logo.png")} style={styles.logo} />
      </View>

      {/* Login Form */}
      <View style={styles.form}>
        <Text style={styles.loginTitle}>Login</Text>
        <Text style={styles.loginSubtitle}>
          Please enter the email and password {"\n"}that admin provided for you
        </Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
        </View>

        <Text style={styles.forgotPassword}>Forgot password?</Text>

        {/* Login Button */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  header: {
    backgroundColor: "#004d40",
    borderBottomRightRadius: 60,
    borderBottomLeftRadius: 60,
    alignItems: "center",
    paddingVertical: 40
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center"
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#e0e0e0",
    textAlign: "center",
    marginVertical: 10
  },
  logo: {
    width: 100,
    height: 100,
    marginTop: 10
  },
  form: {
    padding: 20
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5
  },
  loginSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10
  },
  input: {
    flex: 1,
    padding: 10
  },
  icon: {
    marginRight: 5
  },
  forgotPassword: {
    alignSelf: "flex-end",
    color: "#004d40",
    marginBottom: 20,
    fontSize: 12
  },
  button: {
    backgroundColor: "#004d40",
    padding: 15,
    borderRadius: 25,
    alignItems: "center"
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  }
});
