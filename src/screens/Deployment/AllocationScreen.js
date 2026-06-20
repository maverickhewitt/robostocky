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

//This screen is for allocating lab hardware to active robot builds. It allows users to input a component ID and select or create a project name for deployment. The screen also includes a modal for project selection, creation, editing, and deletion.
export default function AllocationScreen({ navigation }) {
  const [componentId, setComponentId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editProjectName, setEditProjectName] = useState("");

  useFocusEffect(
    useCallback(() => {
      fetchProjects();
    }, []),
  );

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, name")
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

    const { data: compData, error: compError } = await supabase
      .from("components")
      .select("quantity, name")
      .eq("id", componentId)
      .single();

    if (compError || !compData) {
      Alert.alert("Error", "Component ID not found in inventory.");
      return;
    }

    if (compData.quantity <= 0) {
      Alert.alert(
        "Out of Stock",
        `There are no more units of "${compData.name}" available in the lab to allocate.`,
      );
      return;
    }

    const { error: deployError } = await supabase
      .from("deployments")
      .insert([{ component_id: componentId, project_name: projectName }]);

    if (deployError) {
      Alert.alert("Error", deployError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from("components")
      .update({ quantity: compData.quantity - 1 })
      .eq("id", componentId);

    if (updateError) {
      Alert.alert(
        "Warning",
        "Allocated to project, but failed to deduct inventory count.",
      );
    } else {
      Alert.alert(
        "Success",
        "Component allocated and inventory quantity updated!",
      );
      navigation.goBack();
    }
  };

  const selectProject = (selectedName) => {
    setProjectName(selectedName);
    setDropdownVisible(false);
    setSearchText("");
    setEditingProjectId(null);
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
      await fetchProjects();
      selectProject(newProjName);
      setIsCreating(false);
    }
  };

  const handleDeleteProject = (id, name) => {
    Alert.alert(
      "Delete Project",
      `Are you sure you want to permanently delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("projects")
              .delete()
              .eq("id", id);
            if (error) {
              if (error.code === "23503") {
                Alert.alert(
                  "Cannot Delete",
                  "This project has active hardware deployed to it. Remove deployments first.",
                );
              } else {
                Alert.alert("Error", error.message);
              }
            } else {
              fetchProjects();
              if (projectName === name) setProjectName("");
            }
          },
        },
      ],
    );
  };

  const startEditProject = (item) => {
    setEditingProjectId(item.id);
    setEditProjectName(item.name);
  };

  const saveEditProject = async () => {
    if (!editProjectName.trim()) return;

    const { error } = await supabase
      .from("projects")
      .update({ name: editProjectName.trim() })
      .eq("id", editingProjectId);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      const oldProject = projects.find((p) => p.id === editingProjectId);
      if (oldProject && projectName === oldProject.name) {
        setProjectName(editProjectName.trim());
      }

      setEditingProjectId(null);
      fetchProjects();
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
            placeholder="e.g., 1042"
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
              keyExtractor={(item) => item.id.toString()}
              keyboardShouldPersistTaps="handled"
              style={styles.listArea}
              renderItem={({ item }) => (
                <View style={styles.modalItemRow}>
                  {editingProjectId === item.id ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={styles.editInput}
                        value={editProjectName}
                        onChangeText={setEditProjectName}
                        autoFocus
                      />
                      <TouchableOpacity
                        style={styles.saveActionBtn}
                        onPress={saveEditProject}>
                        <Text style={styles.saveActionText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelActionBtn}
                        onPress={() => setEditingProjectId(null)}>
                        <Text style={styles.cancelActionText}>X</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => selectProject(item.name)}>
                        <Text style={styles.modalItemText}>{item.name}</Text>
                      </TouchableOpacity>

                      <View style={styles.actionGroup}>
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => startEditProject(item)}>
                          <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() =>
                            handleDeleteProject(item.id, item.name)
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
                setEditingProjectId(null);
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
