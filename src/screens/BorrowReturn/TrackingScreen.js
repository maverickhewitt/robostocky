import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabaseClient";

export default function TrackingScreen({ navigation }) {
  const [borrowerName, setBorrowerName] = useState("");
  const [componentId, setComponentId] = useState("");
  const [activeLoans, setActiveLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  const fetchActiveLoans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("borrow_records")
      .select("*")
      .eq("status", "borrowed")
      .order("borrow_date", { ascending: false });

    if (!error && data) {
      setActiveLoans(data);
    }
    setLoading(false);
  };

  const handleBorrow = async () => {
    if (!borrowerName || !componentId) {
      Alert.alert(
        "Missing Fields",
        "Please fill in both the borrower name and component ID.",
      );
      return;
    }

    const { error } = await supabase.from("borrow_records").insert([
      {
        borrower_name: borrowerName,
        component_id: componentId,
        status: "borrowed",
        borrow_date: new Date(),
      },
    ]);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Component loaned successfully");
      setBorrowerName("");
      setComponentId("");
      fetchActiveLoans();
    }
  };

  const handleReturn = async (compId, borrower) => {
    const { error } = await supabase
      .from("borrow_records")
      .update({ status: "returned", return_date: new Date() })
      .eq("component_id", compId)
      .eq("borrower_name", borrower)
      .eq("status", "borrowed");

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Component marked as returned");
      fetchActiveLoans();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown Date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderLoanItem = ({ item }) => (
    <View style={styles.loanCard}>
      <View style={styles.loanInfo}>
        <Text style={styles.borrowerName}>{item.borrower_name}</Text>
        <Text style={styles.componentId}>ID: {item.component_id}</Text>
        <Text style={styles.dateText}>
          Borrowed: {formatDate(item.borrow_date)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.returnButton}
        onPress={() => handleReturn(item.component_id, item.borrower_name)}>
        <Text style={styles.returnButtonText}>Return</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTextContainer}>
        <Text style={styles.title}>Borrow & Return</Text>
        <Text style={styles.subtitle}>Manage lab hardware circulation</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Issue New Loan</Text>

        <Text style={styles.label}>Borrower Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Trevor Leong"
          placeholderTextColor="#94a3b8"
          value={borrowerName}
          onChangeText={setBorrowerName}
        />

        <Text style={styles.label}>Hardware ID</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., COMP-2048"
          placeholderTextColor="#94a3b8"
          value={componentId}
          onChangeText={setComponentId}
        />

        <TouchableOpacity style={styles.borrowButton} onPress={handleBorrow}>
          <Text style={styles.borrowButtonText}>Register Loan</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.listTitle}>Active Loans</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : (
          <FlatList
            data={activeLoans}
            keyExtractor={(item) =>
              item.id?.toString() || Math.random().toString()
            }
            renderItem={renderLoanItem}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No active loans. All equipment is in the lab!
                </Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerTextContainer: {
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
  borrowButton: {
    backgroundColor: "#0f172a",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  borrowButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
    marginLeft: 4,
  },
  loanCard: {
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
    borderLeftColor: "#10b981",
  },
  loanInfo: {
    flex: 1,
    paddingRight: 12,
  },
  borrowerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  componentId: {
    fontSize: 14,
    color: "#475569",
    fontFamily: "monospace",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  returnButton: {
    backgroundColor: "#ecfdf5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  returnButtonText: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
});
