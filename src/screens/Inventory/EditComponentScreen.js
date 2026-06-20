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

// This screen allows users to edit existing components in the inventory, including updating the component's name, category, and quantity. It also provides functionality for managing categories, such as creating new categories, editing existing ones, and deleting them. The screen uses a modal for category selection and management, ensuring a smooth user experience.
export default function EditComponentScreen({ route, navigation }) {
  const { item } = route.params;

  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [quantity, setQuantity] = useState(item.quantity.toString());

  const [categories, setCategories] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, []),
  );

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true });
    if (!error && data) {
      setCategories(data);
    }
  };

  const handleUpdate = async () => {
    if (!name || !category || !quantity) {
      Alert.alert("Missing Fields", "Please ensure all fields are filled.");
      return;
    }

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

  const selectCategory = (selectedName) => {
    setCategory(selectedName);
    setDropdownVisible(false);
    setSearchText("");
    setEditingCategoryId(null);
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
      await fetchCategories();
      selectCategory(newCatName);
      setIsCreating(false);
    }
  };

  const handleDeleteCategory = (id, name) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to permanently remove "${name}" from the options list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("categories")
              .delete()
              .eq("id", id);
            if (error) {
              Alert.alert("Error", error.message);
            } else {
              fetchCategories();
              if (category === name) setCategory("");
            }
          },
        },
      ],
    );
  };

  const startEditCategory = (catItem) => {
    setEditingCategoryId(catItem.id);
    setEditCategoryName(catItem.name);
  };

  const saveEditCategory = async () => {
    if (!editCategoryName.trim()) return;

    const { error } = await supabase
      .from("categories")
      .update({ name: editCategoryName.trim() })
      .eq("id", editingCategoryId);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      const oldCategory = categories.find((c) => c.id === editingCategoryId);
      if (oldCategory && category === oldCategory.name) {
        setCategory(editCategoryName.trim());
      }
      setEditingCategoryId(null);
      fetchCategories();
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
              keyExtractor={(catItem) => catItem.id.toString()}
              keyboardShouldPersistTaps="handled"
              style={styles.listArea}
              renderItem={({ item: catItem }) => (
                <View style={styles.modalItemRow}>
                  {editingCategoryId === catItem.id ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={styles.editInput}
                        value={editCategoryName}
                        onChangeText={setEditCategoryName}
                        autoFocus
                      />
                      <TouchableOpacity
                        style={styles.saveActionBtn}
                        onPress={saveEditCategory}>
                        <Text style={styles.saveActionText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelActionBtn}
                        onPress={() => setEditingCategoryId(null)}>
                        <Text style={styles.cancelActionText}>X</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => selectCategory(catItem.name)}>
                        <Text style={styles.modalItemText}>{catItem.name}</Text>
                      </TouchableOpacity>

                      <View style={styles.actionGroup}>
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => startEditCategory(catItem)}>
                          <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() =>
                            handleDeleteCategory(catItem.id, catItem.name)
                          }>
                          <Text style={styles.deleteBtnText}>Del</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
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
                setEditingCategoryId(null);
              }}>
              <Text style={styles.closeModalBtnText}>Close Menu</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  modalItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 12,
  },
  modalItem: {
    flex: 1,
    paddingVertical: 4,
  },
  modalItemText: { fontSize: 16, color: "#334155" },
  actionGroup: {
    flexDirection: "row",
    gap: 8,
  },
  editBtn: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  editBtnText: { color: "#3b82f6", fontSize: 12, fontWeight: "700" },
  deleteBtn: {
    backgroundColor: "#fef2f2",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  deleteBtnText: { color: "#ef4444", fontSize: 12, fontWeight: "700" },

  editRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#8b5cf6",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    fontSize: 14,
    color: "#0f172a",
  },
  saveActionBtn: {
    backgroundColor: "#8b5cf6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  saveActionText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  cancelActionBtn: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  cancelActionText: { color: "#64748b", fontSize: 12, fontWeight: "700" },

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
