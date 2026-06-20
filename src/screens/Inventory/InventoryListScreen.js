import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabaseClient";

//This screen displays a list of all components in the lab inventory. Users can search for components by name or category, view their details, and navigate to the EditComponentScreen to update component information.
export default function InventoryListScreen({ navigation }) {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchInventory();
    }, []),
  );

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("components")
      .select("*")
      .order("name", { ascending: true });

    if (!error && data) {
      setInventory(data);
      setFilteredInventory(data);
    }
    setLoading(false);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const filtered = inventory.filter(
        (item) =>
          item.name.toLowerCase().includes(text.toLowerCase()) ||
          item.category.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredInventory(filtered);
    } else {
      setFilteredInventory(inventory);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemMain}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
          <Text style={styles.itemId}>ID: {item.id}</Text>
        </View>
        <View style={styles.quantityContainer}>
          <Text
            style={[
              styles.quantityText,
              item.quantity > 0 ? styles.inStock : styles.outOfStock,
            ]}>
            {item.quantity}
          </Text>
          <Text style={styles.quantityLabel}>Qty</Text>
        </View>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate("EditComponent", { item })}>
          <Text style={styles.editBtnText}>Edit Record</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or category..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : filteredInventory.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No components found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredInventory}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
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
  quantityContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 70,
  },
  quantityText: {
    fontSize: 24,
    fontWeight: "800",
  },
  inStock: {
    color: "#10b981",
  },
  outOfStock: {
    color: "#ef4444",
  },
  quantityLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 2,
  },
  actionRow: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
    alignItems: "flex-end",
  },
  editBtn: {
    backgroundColor: "#f8fafc",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  editBtnText: {
    color: "#3b82f6",
    fontSize: 14,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
  },
});
