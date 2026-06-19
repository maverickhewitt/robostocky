import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabaseClient";

export default function EditComponentScreen({ route, navigation }) {
  const { item } = route.params;

  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [quantity, setQuantity] = useState(item.quantity.toString());

  const handleUpdate = async () => {
    const { error } = await supabase
      .from("components")
      .update({ name, category, quantity: parseInt(quantity) })
      .eq("id", item.id);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Hardware details updated successfully");
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Update Record</Text>
          <Text style={styles.subtitle}>
            Edit inventory details for ID: {item.id}
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Component Name</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Technical Category</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor="#94a3b8"
            value={category}
            onChangeText={setCategory}
          />

          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor="#94a3b8"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleUpdate}>
            <Text style={styles.primaryButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
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
    fontFamily: "monospace",
  },
  formCard: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
