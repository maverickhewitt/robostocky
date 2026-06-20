import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AddComponentScreen from "../screens/Acquisition/AddComponentScreen";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import TrackingScreen from "../screens/BorrowReturn/TrackingScreen";
import DashboardScreen from "../screens/Dashboard/DashboardScreen";
import FaultManagementScreen from "../screens/Decommissioning/FaultManagementScreen";
import AllocationScreen from "../screens/Deployment/AllocationScreen";
import DeploymentListScreen from "../screens/Deployment/DeploymentListScreen";
import EditComponentScreen from "../screens/Inventory/EditComponentScreen";
import InventoryListScreen from "../screens/Inventory/InventoryListScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";

const Stack = createNativeStackNavigator();

//This is for navigation for each page for the app. Each screen is defined here with its corresponding component and options.
export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: "Create Account" }}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: "Lab Inventory Dashboard", headerBackVisible: false }}
      />
      <Stack.Screen
        name="Acquisition"
        component={AddComponentScreen}
        options={{ title: "Acquisition Entry" }}
      />
      <Stack.Screen
        name="Deployment"
        component={AllocationScreen}
        options={{ title: "Project Deployment" }}
      />
      <Stack.Screen
        name="Decommissioning"
        component={FaultManagementScreen}
        options={{ title: "Fault Management" }}
      />
      <Stack.Screen
        name="BorrowReturn"
        component={TrackingScreen}
        options={{ title: "Borrow & Return" }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "User Account" }}
      />
      <Stack.Screen
        name="InventoryList"
        component={InventoryListScreen}
        options={{ title: "Inventory Catalog" }}
      />
      <Stack.Screen
        name="DeploymentList"
        component={DeploymentListScreen}
        options={{ title: "Active Deployments" }}
      />
      <Stack.Screen
        name="EditComponent"
        component={EditComponentScreen}
        options={{ title: "Edit Component" }}
      />
    </Stack.Navigator>
  );
}
