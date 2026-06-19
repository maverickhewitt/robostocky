import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabaseClient";

export default function FaultManagementScreen({ navigation }) {
  const [components, setComponents] = useState([]);
  const [filteredComponents, setFilteredComponents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("components")
      .select("*")
      .order("name", { ascending: true });

    if (!error && data) {
      setComponents(data);
      setFilteredComponents(data);
    }
    setLoading(false);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const filtered = components.filter(
        (item) =>
          item.name.toLowerCase().includes(text.toLowerCase()) ||
          item.id.toString().includes(text),
      );
      setFilteredComponents(filtered);
    } else {
      setFilteredComponents(components);
    }
  };

  const confirmDelete = (id, name) => {
    Alert.alert(
      "Confirm Decommission",
      `Are you sure you want to permanently delete "${name}" (ID: ${id}) from the lab inventory? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decommission",
          style: "destructive",
          onPress: () => executeDelete(id),
        },
      ],
    );
  };

  const executeDelete = async (id) => {
    const { error } = await supabase.from("components").delete().eq("id", id);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert(
        "Success",
        "Hardware decommissioned and deleted from records",
      );
      const updatedList = components.filter((item) => item.id !== id);
      setComponents(updatedList);
      setFilteredComponents(updatedList);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
        <Text style={styles.itemId}>
          ID: {item.id} | Qty: {item.quantity}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => confirmDelete(item.id, item.name)}>
        <Text style={styles.deleteButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Warning: Decommissioning permanently removes the hardware from the
            database.
          </Text>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by component name or ID..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
        </View>
      ) : filteredComponents.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            No components found to decommission.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredComponents}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  warningBox: {
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fca5a5",
    marginBottom: 16,
  },
  warningText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "600",
  },
  searchInput: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#0f172a",
  },
  listContainer: {
    padding: 20,
  },
  itemCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  itemId: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: "monospace",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
});
