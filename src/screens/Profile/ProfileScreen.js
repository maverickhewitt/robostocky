import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabaseClient";

//This screen is for managing the user's profile and account settings. It allows users to view their email and lab role, update their password, change their lab role, sign out, or delete their account permanently.
export default function ProfileScreen({ navigation }) {
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("Loading...");

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email);
      setUserRole(user.user_metadata?.role || "Team Member");
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert(
        "Invalid Password",
        "Password must be at least 6 characters.",
      );
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Your password has been updated.");
      setPasswordModalVisible(false);
      setNewPassword("");
    }
  };

  const handleUpdateRole = async () => {
    if (!newRole.trim()) return;

    const { error } = await supabase.auth.updateUser({
      data: { role: newRole.trim() },
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Your lab role has been updated.");
      setUserRole(newRole.trim());
      setRoleModalVisible(false);
      setNewRole("");
    }
  };

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
    const { error } = await supabase.rpc("delete_user");

    if (error) {
      Alert.alert(
        "Error",
        "Failed to delete account. Make sure the delete_user RPC is set up in Supabase.",
      );
      console.log(error);
    } else {
      await supabase.auth.signOut();
      Alert.alert(
        "Account Deleted",
        "Your account has been permanently removed.",
      );
      navigation.replace("Login");
    }
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
            <View>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userEmail}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View>
              <Text style={styles.infoLabel}>Lab Role</Text>
              <Text style={styles.infoValue}>{userRole}</Text>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                setNewRole(userRole);
                setRoleModalVisible(true);
              }}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRowNoBorder}>
            <View>
              <Text style={styles.infoLabel}>Security</Text>
              <Text style={styles.infoValue}>••••••••</Text>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setPasswordModalVisible(true)}>
              <Text style={styles.editBtnText}>Change</Text>
            </TouchableOpacity>
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

      <Modal
        visible={passwordModalVisible}
        transparent={true}
        animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={styles.modalLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Min. 6 characters"
              placeholderTextColor="#94a3b8"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoFocus={true}
            />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleUpdatePassword}>
              <Text style={styles.primaryButtonText}>Update Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => {
                setPasswordModalVisible(false);
                setNewPassword("");
              }}>
              <Text style={styles.closeModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={roleModalVisible} transparent={true} animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Lab Role</Text>
            <Text style={styles.modalLabel}>Role Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Inventory Manager, Student"
              placeholderTextColor="#94a3b8"
              value={newRole}
              onChangeText={setNewRole}
              autoFocus={true}
            />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleUpdateRole}>
              <Text style={styles.primaryButtonText}>Save Role</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => {
                setRoleModalVisible(false);
                setNewRole("");
              }}>
              <Text style={styles.closeModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoRowNoBorder: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "600",
  },
  editBtn: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editBtnText: {
    color: "#3b82f6",
    fontSize: 14,
    fontWeight: "700",
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  primaryButton: {
    backgroundColor: "#0f172a",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  closeModalBtn: {
    paddingVertical: 16,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    alignItems: "center",
  },
  closeModalBtnText: {
    color: "#475569",
    fontWeight: "700",
    fontSize: 15,
  },
});
