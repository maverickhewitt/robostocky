import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabaseClient";

export default function FaultManagementScreen({ navigation }) {
  const [componentId, setComponentId] = useState("");
  const [componentName, setComponentName] = useState("");
  const [faultyQty, setFaultyQty] = useState("");
  const [reason, setReason] = useState("");

  const [components, setComponents] = useState([]);
  const [faults, setFaults] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  // New state for editing a fault's reason
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingFault, setEditingFault] = useState(null);
  const [editReason, setEditReason] = useState("");

  useFocusEffect(
    useCallback(() => {
      fetchInventory();
      fetchFaults();
    }, []),
  );

  const fetchInventory = async () => {
    const { data } = await supabase
      .from("components")
      .select("id, name, quantity")
      .order("name", { ascending: true });
    if (data) setComponents(data);
  };

  const fetchFaults = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("fault_logs")
      .select("*")
      .eq("status", "faulty")
      .order("id", { ascending: false });
    if (data) setFaults(data);
    setLoading(false);
  };

  // --- 1. REPORT BROKEN ITEM ---
  const handleReportFault = async () => {
    if (!componentId || !faultyQty || !reason) {
      Alert.alert(
        "Missing Fields",
        "Please select a component, quantity, and reason.",
      );
      return;
    }

    const qtyToReport = parseInt(faultyQty);

    const { data: compData } = await supabase
      .from("components")
      .select("quantity")
      .eq("id", componentId)
      .single();

    if (!compData || compData.quantity < qtyToReport) {
      Alert.alert(
        "Invalid Quantity",
        "You cannot report more items broken than you have in stock!",
      );
      return;
    }

    await supabase
      .from("components")
      .update({ quantity: compData.quantity - qtyToReport })
      .eq("id", componentId);

    const { error } = await supabase.from("fault_logs").insert([
      {
        component_id: componentId,
        component_name: componentName,
        quantity: qtyToReport,
        reason: reason,
        status: "faulty",
      },
    ]);

    if (!error) {
      Alert.alert("Reported", "Item moved from inventory to the faulty list.");
      setComponentId("");
      setComponentName("");
      setFaultyQty("");
      setReason("");
      fetchInventory();
      fetchFaults();
    }
  };

  // --- 2. REPAIR ITEM (Put back in inventory) ---
  const handleRepair = (fault) => {
    Alert.alert(
      "Repair Equipment",
      `Mark ${fault.quantity}x "${fault.component_name}" as repaired and return to lab inventory?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Repair & Restock",
          onPress: async () => {
            const { data: compData } = await supabase
              .from("components")
              .select("quantity")
              .eq("id", fault.component_id)
              .single();

            if (compData) {
              await supabase
                .from("components")
                .update({ quantity: compData.quantity + fault.quantity })
                .eq("id", fault.component_id);
              await supabase
                .from("fault_logs")
                .update({ status: "repaired" })
                .eq("id", fault.id);
              Alert.alert("Success", "Item repaired and restocked.");
              fetchInventory();
              fetchFaults();
            }
          },
        },
      ],
    );
  };

  // --- 3. SCRAP ITEM (Permanently remove) ---
  const handleScrap = (fault) => {
    Alert.alert(
      "Scrap Equipment",
      `Permanently decommission ${fault.quantity}x "${fault.component_name}"? This means it cannot be repaired.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Scrap Item",
          style: "destructive",
          onPress: async () => {
            await supabase
              .from("fault_logs")
              .update({ status: "scrapped" })
              .eq("id", fault.id);
            Alert.alert("Decommissioned", "Item permanently scrapped.");
            fetchFaults();
          },
        },
      ],
    );
  };

  // --- 4. EDIT FAULT REASON ---
  const openEditModal = (fault) => {
    setEditingFault(fault);
    setEditReason(fault.reason);
    setEditModalVisible(true);
  };

  const saveEditReason = async () => {
    if (!editReason.trim()) return;

    const { error } = await supabase
      .from("fault_logs")
      .update({ reason: editReason })
      .eq("id", editingFault.id);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setEditModalVisible(false);
      setEditingFault(null);
      fetchFaults();
    }
  };

  // --- 5. UNDO / CANCEL FAULT LOG ---
  const handleUndoFault = (fault) => {
    Alert.alert(
      "Undo Fault Report",
      `Did you make a mistake? This will delete this fault record and return the ${fault.quantity}x items back to the active inventory.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Undo Mistake",
          style: "destructive",
          onPress: async () => {
            const { data: compData } = await supabase
              .from("components")
              .select("quantity")
              .eq("id", fault.component_id)
              .single();

            if (compData) {
              await supabase
                .from("components")
                .update({ quantity: compData.quantity + fault.quantity })
                .eq("id", fault.component_id);
              await supabase.from("fault_logs").delete().eq("id", fault.id);
              Alert.alert(
                "Reverted",
                "Fault log deleted and inventory restored.",
              );
              fetchInventory();
              fetchFaults();
            }
          },
        },
      ],
    );
  };

  const selectComponent = (item) => {
    setComponentId(item.id);
    setComponentName(item.name);
    setDropdownVisible(false);
    setSearchText("");
  };

  const filteredComponents = components.filter(
    (c) =>
      c.name.toLowerCase().includes(searchText.toLowerCase()) ||
      c.id.toString().includes(searchText),
  );

  const renderFaultItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemMainInfo}>
        <View style={styles.itemHeaderRow}>
          <Text style={styles.itemName}>{item.component_name}</Text>
          <View style={styles.editUndoRow}>
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleUndoFault(item)}
              style={styles.iconBtn}>
              <Text style={[styles.iconBtnText, { color: "#ef4444" }]}>
                Undo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.faultyDetails}>
          ID: {item.component_id} | Qty Broken: {item.quantity}
        </Text>
        <View style={styles.reasonBox}>
          <Text style={styles.reasonText}>Issue: {item.reason}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.repairBtn}
          onPress={() => handleRepair(item)}>
          <Text style={styles.repairBtnText}>Repair & Restock</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.scrapBtn}
          onPress={() => handleScrap(item)}>
          <Text style={styles.scrapBtnText}>Scrap Item</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#ef4444" />
          </View>
        ) : (
          <FlatList
            data={faults}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderFaultItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.headerContainer}>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>Fault Management</Text>
                  <Text style={styles.subtitle}>
                    Report, repair, or scrap broken lab hardware
                  </Text>
                </View>

                <View style={styles.formCard}>
                  <Text style={styles.sectionTitle}>Report Broken Item</Text>

                  <Text style={styles.label}>Hardware Component</Text>
                  <TouchableOpacity
                    style={styles.dropdownInput}
                    onPress={() => setDropdownVisible(true)}>
                    <Text
                      style={
                        componentName
                          ? styles.dropdownText
                          : styles.dropdownPlaceholder
                      }>
                      {componentName || "Select component from inventory..."}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.row}>
                    <View style={styles.halfWidth}>
                      <Text style={styles.label}>Faulty Qty</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                        value={faultyQty}
                        onChangeText={setFaultyQty}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <Text style={styles.label}>Reason / Issue</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Burnt motor, bent pins"
                    placeholderTextColor="#94a3b8"
                    value={reason}
                    onChangeText={setReason}
                  />

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleReportFault}>
                    <Text style={styles.primaryButtonText}>Log Fault</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.listTitle}>Items Pending Repair</Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No broken items. Everything is working perfectly!
                </Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>

      {/* Component Selection Modal */}
      <Modal visible={dropdownVisible} transparent={true} animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Component</Text>
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search by name or ID..."
              placeholderTextColor="#94a3b8"
              value={searchText}
              onChangeText={setSearchText}
              autoFocus={true}
            />
            <FlatList
              data={filteredComponents}
              keyExtractor={(item) => item.id.toString()}
              keyboardShouldPersistTaps="handled"
              style={styles.listArea}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => selectComponent(item)}>
                  <Text style={styles.modalItemText}>
                    {item.name} (Available: {item.quantity})
                  </Text>
                </TouchableOpacity>
              )}
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

      {/* Edit Reason Modal */}
      <Modal visible={editModalVisible} transparent={true} animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Fault Reason</Text>
            <Text style={styles.label}>Reason / Issue</Text>
            <TextInput
              style={styles.input}
              value={editReason}
              onChangeText={setEditReason}
              autoFocus={true}
              multiline
            />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={saveEditReason}>
              <Text style={styles.primaryButtonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setEditModalVisible(false)}>
              <Text style={styles.closeModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1 },
  listContainer: { padding: 24, paddingTop: 40, paddingBottom: 40 },
  headerContainer: { marginBottom: 16 },
  headerTextContainer: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#64748b" },
  formCard: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 20,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginLeft: 4,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  halfWidth: { width: "48%" },
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
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
    marginLeft: 4,
  },

  itemCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },
  itemMainInfo: { marginBottom: 16 },
  itemHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
    paddingRight: 8,
  },
  editUndoRow: { flexDirection: "row", gap: 12 },
  iconBtn: { paddingVertical: 2, paddingHorizontal: 4 },
  iconBtnText: { fontSize: 13, fontWeight: "600", color: "#3b82f6" },
  faultyDetails: {
    fontSize: 13,
    color: "#475569",
    fontFamily: "monospace",
    marginBottom: 12,
  },
  reasonBox: {
    backgroundColor: "#fef2f2",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  reasonText: { fontSize: 14, color: "#b91c1c", fontWeight: "500" },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 16,
  },
  repairBtn: {
    flex: 1,
    backgroundColor: "#ecfdf5",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    alignItems: "center",
  },
  repairBtnText: { color: "#059669", fontSize: 14, fontWeight: "700" },
  scrapBtn: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  scrapBtnText: { color: "#64748b", fontSize: 14, fontWeight: "700" },

  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  emptyText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
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
  listArea: { maxHeight: 300 },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalItemText: { fontSize: 16, color: "#334155" },
  closeModalBtn: {
    marginTop: 16,
    paddingVertical: 16,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    alignItems: "center",
  },
  closeModalBtnText: { color: "#475569", fontWeight: "700", fontSize: 15 },
});
