import { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabaseClient";

export default function ProfileScreen({ navigation }) {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
      }
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error signing out", error.message);
    } else {
      navigation.replace("Login");
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you absolutely sure? This action cannot be undone and will permanently erase your access to the lab inventory.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: handleDeleteAccount,
        },
      ],
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Backend Configuration Required",
      "Direct account deletion requires an Admin RPC or Edge Function in Supabase. Please contact the system administrator to complete this action.",
      [{ text: "Understood" }],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>User Account</Text>
          <Text style={styles.subtitle}>Manage your profile and settings</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Account Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{userEmail || "Loading..."}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>Inventory Manager</Text>
          </View>
        </View>

        <View style={styles.actionCard}>
          <Text style={styles.sectionLabel}>Session Options</Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSignOut}>
            <Text style={styles.secondaryButtonText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dangerOutlineButton}
            onPress={confirmDeleteAccount}>
            <Text style={styles.dangerOutlineButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    padding: 24,
    paddingTop: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  actionCard: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoLabel: {
    fontSize: 16,
    color: "#475569",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "700",
  },
  dangerOutlineButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  dangerOutlineButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "700",
  },
});
