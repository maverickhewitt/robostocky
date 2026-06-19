import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://tyylgejsxluxrsazclcq.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eWxnZWpzeGx1eHJzYXpjbGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1Nzk3NDcsImV4cCI6MjA4MjE1NTc0N30.9JLwSNA_yo9meDZpcrFYuGiiJGky682JZAsxbx42xQI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
