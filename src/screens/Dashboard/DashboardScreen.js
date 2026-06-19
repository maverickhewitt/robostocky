import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabaseClient";

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({
    inventory: 0,
    deployments: 0,
    borrowed: 0,
  });
  const [loading, setLoading] = useState(true);

  const menuItems = [
    {
      title: "Acquisition",
      subtitle: "Register new components",
      route: "Acquisition",
      color: "#3b82f6",
    },
    {
      title: "Deployment",
      subtitle: "Allocate to projects",
      route: "Deployment",
      color: "#8b5cf6",
    },
    {
      title: "Decommissioning",
      subtitle: "Fault management",
      route: "Decommissioning",
      color: "#ef4444",
    },
    {
      title: "Tracking",
      subtitle: "Borrow & return logs",
      route: "BorrowReturn",
      color: "#10b981",
    },
  ];

  useFocusEffect(
    useCallback(() => {
      fetchDashboardStats();
    }, []),
  );

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const { count: inventoryCount } = await supabase
        .from("components")
        .select("*", { count: "exact", head: true });

      const { count: deploymentsCount } = await supabase
        .from("deployments")
        .select("*", { count: "exact", head: true });

      const { count: borrowedCount } = await supabase
        .from("borrow_records")
        .select("*", { count: "exact", head: true })
        .eq("status", "borrowed");

      setStats({
        inventory: inventoryCount || 0,
        deployments: deploymentsCount || 0,
        borrowed: borrowedCount || 0,
      });
    } catch (error) {
      console.log("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>RoboStocky</Text>
            <Text style={styles.title}>Lab Dashboard</Text>
          </View>

          <TouchableOpacity
            style={styles.profileAvatar}
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.7}>
            <Text style={styles.profileAvatarText}>M</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Lab Overview</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.inventory}</Text>
              <Text style={styles.statLabel}>Total Assets</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: "#8b5cf6" }]}>
                {stats.deployments}
              </Text>
              <Text style={styles.statLabel}>Active Builds</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: "#10b981" }]}>
                {stats.borrowed}
              </Text>
              <Text style={styles.statLabel}>Out on Loan</Text>
            </View>
          </View>
        )}

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.mainActionBtn}
            onPress={() => navigation.navigate("InventoryList")}>
            <Text style={styles.mainActionBtnText}>
              Browse Full Inventory Catalog
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainActionBtn, styles.secondaryActionBtn]}
            onPress={() => navigation.navigate("DeploymentList")}>
            <Text style={styles.secondaryActionBtnText}>
              View Active Deployments
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.card, { borderTopColor: item.color }]}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.8}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  greeting: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a",
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#475569",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
    marginTop: 8,
  },
  loadingContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#3b82f6",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
  },
  actionButtonsContainer: {
    marginBottom: 32,
  },
  mainActionBtn: {
    backgroundColor: "#0f172a",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  mainActionBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryActionBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowOpacity: 0,
    elevation: 0,
    marginBottom: 0,
  },
  secondaryActionBtnText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderTopWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 120,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
});
