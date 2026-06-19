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

export default function AllocationScreen({ navigation }) {
  const [componentId, setComponentId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProjects();
    }, []),
  );

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("name")
      .order("name", { ascending: true });
    if (!error && data) {
      setProjects(data);
    }
  };

  const handleAllocation = async () => {
    if (!componentId || !projectName) {
      Alert.alert(
        "Missing Fields",
        "Please provide a Component ID and select a Project.",
      );
      return;
    }

    const { error } = await supabase
      .from("deployments")
      .insert([{ component_id: componentId, project_name: projectName }]);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Component allocated to project successfully");
      navigation.goBack();
    }
  };

  const selectProject = (selectedName) => {
    setProjectName(selectedName);
    setDropdownVisible(false);
    setSearchText("");
  };

  const handleCreateNewProject = async () => {
    const newProjName = searchText.trim();
    if (!newProjName) return;

    setIsCreating(true);
    const { error } = await supabase
      .from("projects")
      .insert([{ name: newProjName }]);

    if (error) {
      Alert.alert("Error", error.message);
      setIsCreating(false);
    } else {
      setProjects([...projects, { name: newProjName }]);
      selectProject(newProjName);
      setIsCreating(false);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  const exactMatch = projects.some(
    (p) => p.name.toLowerCase() === searchText.toLowerCase().trim(),
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Project Deployment</Text>
          <Text style={styles.subtitle}>
            Allocate hardware to an active robot build
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Component ID</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., COMP-1042"
            placeholderTextColor="#94a3b8"
            value={componentId}
            onChangeText={setComponentId}
          />

          <Text style={styles.label}>Project Name</Text>
          <TouchableOpacity
            style={styles.dropdownInput}
            onPress={() => setDropdownVisible(true)}>
            <Text
              style={
                projectName ? styles.dropdownText : styles.dropdownPlaceholder
              }>
              {projectName || "Select or create a project..."}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAllocation}>
            <Text style={styles.primaryButtonText}>Allocate to Project</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={dropdownVisible} transparent={true} animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Project</Text>

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
                onPress={handleCreateNewProject}
                disabled={isCreating}>
                {isCreating ? (
                  <ActivityIndicator color="#8b5cf6" size="small" />
                ) : (
                  <Text style={styles.createBtnText}>
                    + Create "{searchText.trim()}"
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <FlatList
              data={filteredProjects}
              keyExtractor={(item, index) => index.toString()}
              keyboardShouldPersistTaps="handled"
              style={styles.listArea}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => selectProject(item.name)}>
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
    backgroundColor: "#8b5cf6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
    backgroundColor: "#f5f3ff",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd6fe",
  },
  createBtnText: { color: "#8b5cf6", fontSize: 15, fontWeight: "700" },
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
