import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../../services/supabaseClient";

//This screen displays a list of all active deployments in the lab inventory. Users can search for deployments by project name or hardware ID.
export default function DeploymentListScreen() {
  const [deployments, setDeployments] = useState([]);
  const [filteredDeployments, setFilteredDeployments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("deployments").select("*");

    if (!error && data) {
      setDeployments(data);
      setFilteredDeployments(data);
    }
    setLoading(false);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const filtered = deployments.filter(
        (item) =>
          item.project_name.toLowerCase().includes(text.toLowerCase()) ||
          item.component_id.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredDeployments(filtered);
    } else {
      setFilteredDeployments(deployments);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.projectName}>{item.project_name}</Text>
        <Text style={styles.componentId}>Hardware ID: {item.component_id}</Text>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>Deployed</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by project or ID..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : filteredDeployments.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No active deployments found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDeployments}
          keyExtractor={(item) =>
            item.id?.toString() || Math.random().toString()
          }
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#8b5cf6",
  },
  itemInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  componentId: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "monospace",
  },
  statusBadge: {
    backgroundColor: "#ede9fe",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  statusText: {
    color: "#8b5cf6",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
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
