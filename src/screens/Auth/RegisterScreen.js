import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabaseClient";

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert("Registration Error", error.message);
    } else {
      Alert.alert("Success", "Account created! You can now log in.");
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}>
      <View style={styles.formContainer}>
        <Image
          source={require("../../../assets/images/robostocky.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Join the Team</Text>
        <Text style={styles.subtitle}>Register for lab inventory access</Text>

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 6 characters)"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
          <Text style={styles.primaryButtonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>
            Already have an account? Log In
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 40,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  primaryButton: {
    backgroundColor: "#0f172a",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
});
