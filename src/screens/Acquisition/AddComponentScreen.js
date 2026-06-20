import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabaseClient";

//This screen is for adding new components to the lab inventory. It allows users to input the component name, select or create a technical category, and specify the quantity. The screen also includes a modal for category selection and creation.
export default function AddComponentScreen({ navigation }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [categories, setCategories] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, []),
  );

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("name")
      .order("name", { ascending: true });
    if (!error && data) {
      setCategories(data);
    }
  };

  const handleAddComponent = async () => {
    if (!name || !category || !quantity) {
      Alert.alert("Missing Fields", "Please fill out all fields.");
      return;
    }

    const { error } = await supabase
      .from("components")
      .insert([{ name, category, quantity: parseInt(quantity) }]);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Component registered to lab inventory");
      navigation.goBack();
    }
  };

  const selectCategory = (selectedName) => {
    setCategory(selectedName);
    setDropdownVisible(false);
    setSearchText("");
  };

  const handleCreateNewCategory = async () => {
    const newCatName = searchText.trim();
    if (!newCatName) return;

    setIsCreating(true);
    const { error } = await supabase
      .from("categories")
      .insert([{ name: newCatName }]);

    if (error) {
      Alert.alert("Error", error.message);
      setIsCreating(false);
    } else {
      setCategories([...categories, { name: newCatName }]);
      selectCategory(newCatName);
      setIsCreating(false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  const exactMatch = categories.some(
    (c) => c.name.toLowerCase() === searchText.toLowerCase().trim(),
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Acquisition Entry</Text>
          <Text style={styles.subtitle}>
            Register new equipment into the database
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Component Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Raspberry Pi 4"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Technical Category</Text>
          <TouchableOpacity
            style={styles.dropdownInput}
            onPress={() => setDropdownVisible(true)}>
            <Text
              style={
                category ? styles.dropdownText : styles.dropdownPlaceholder
              }>
              {category || "Select or create a category..."}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#94a3b8"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAddComponent}>
            <Text style={styles.primaryButtonText}>Register Equipment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={dropdownVisible} transparent={true} animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Category</Text>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search or type to create new..."
              placeholderTextColor="#94a3b8"
              value={searchText}
              onChangeText={setSearchText}
              autoFocus={true}
            />

            {!exactMatch && searchText.trim() !== "" && (
              <TouchableOpacity
                style={styles.createBtn}
                onPress={handleCreateNewCategory}
                disabled={isCreating}>
                {isCreating ? (
                  <ActivityIndicator color="#3b82f6" size="small" />
                ) : (
                  <Text style={styles.createBtnText}>
                    + Create "{searchText.trim()}"
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <FlatList
              data={filteredCategories}
              keyExtractor={(item, index) => index.toString()}
              keyboardShouldPersistTaps="handled"
              style={styles.listArea}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => selectCategory(item.name)}>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchText.trim() === "" ? (
                  <Text style={styles.emptyText}>
                    Start typing to search or create.
                  </Text>
                ) : null
              }
            />

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => {
                setDropdownVisible(false);
                setSearchText("");
              }}>
              <Text style={styles.closeModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { padding: 24, paddingTop: 40 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#64748b" },
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
  dropdownInput: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dropdownPlaceholder: { color: "#94a3b8", fontSize: 16 },
  dropdownText: { color: "#0f172a", fontSize: 16 },
  primaryButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  primaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
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
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
  },
  modalSearchInput: {
    backgroundColor: "#f8fafc",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  createBtn: {
    backgroundColor: "#eff6ff",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  createBtnText: { color: "#2563eb", fontSize: 15, fontWeight: "700" },
  listArea: { maxHeight: 300 },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalItemText: { fontSize: 16, color: "#334155" },
  emptyText: { color: "#94a3b8", textAlign: "center", marginVertical: 20 },
  closeModalBtn: {
    marginTop: 16,
    paddingVertical: 16,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    alignItems: "center",
  },
  closeModalBtnText: { color: "#475569", fontWeight: "700", fontSize: 15 },
});
