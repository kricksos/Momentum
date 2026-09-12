export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          activity_date: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      body_measurements: {
        Row: {
          arm_cm: number | null
          body_fat_percentage: number | null
          chest_cm: number | null
          created_at: string
          id: string
          measured_at: string
          thigh_cm: number | null
          user_id: string
          waist_cm: number | null
          weight_kg: number
        }
        Insert: {
          arm_cm?: number | null
          body_fat_percentage?: number | null
          chest_cm?: number | null
          created_at?: string
          id?: string
          measured_at?: string
          thigh_cm?: number | null
          user_id: string
          waist_cm?: number | null
          weight_kg: number
        }
        Update: {
          arm_cm?: number | null
          body_fat_percentage?: number | null
          chest_cm?: number | null
          created_at?: string
          id?: string
          measured_at?: string
          thigh_cm?: number | null
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cardio_preferences: {
        Row: {
          duration_minutes: number
          enabled: boolean
          id: string
          intensity: string
          modality: string
          session_key: string
          updated_at: string
          user_id: string
          workout_day_id: string | null
        }
        Insert: {
          duration_minutes: number
          enabled?: boolean
          id?: string
          intensity: string
          modality: string
          session_key: string
          updated_at?: string
          user_id: string
          workout_day_id?: string | null
        }
        Update: {
          duration_minutes?: number
          enabled?: boolean
          id?: string
          intensity?: string
          modality?: string
          session_key?: string
          updated_at?: string
          user_id?: string
          workout_day_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cardio_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cardio_preferences_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      cardio_sessions: {
        Row: {
          completed_on: string
          created_at: string
          duration_minutes: number
          id: string
          intensity: string
          modality: string
          session_key: string
          user_id: string
        }
        Insert: {
          completed_on?: string
          created_at?: string
          duration_minutes: number
          id?: string
          intensity: string
          modality: string
          session_key: string
          user_id: string
        }
        Update: {
          completed_on?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          intensity?: string
          modality?: string
          session_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cardio_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          completed: boolean
          created_at: string
          exercise_id: string
          id: string
          repetitions: number
          set_number: number
          weight_kg: number | null
          workout_session_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          exercise_id: string
          id?: string
          repetitions: number
          set_number: number
          weight_kg?: number | null
          workout_session_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          exercise_id?: string
          id?: string
          repetitions?: number
          set_number?: number
          weight_kg?: number | null
          workout_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          alternatives: Json
          category: string
          created_at: string
          description: string
          difficulty: string
          equipment_required: Json
          id: string
          image_end_url: string | null
          image_start_url: string | null
          media_author: string | null
          media_license: string | null
          media_source: string | null
          muscle_groups: Json
          name: string
          primary_muscle: string | null
          restrictions: Json
          updated_at: string
          video_url: string | null
        }
        Insert: {
          alternatives?: Json
          category: string
          created_at?: string
          description: string
          difficulty: string
          equipment_required?: Json
          id?: string
          image_end_url?: string | null
          image_start_url?: string | null
          media_author?: string | null
          media_license?: string | null
          media_source?: string | null
          muscle_groups?: Json
          name: string
          primary_muscle?: string | null
          restrictions?: Json
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          alternatives?: Json
          category?: string
          created_at?: string
          description?: string
          difficulty?: string
          equipment_required?: Json
          id?: string
          image_end_url?: string | null
          image_start_url?: string | null
          media_author?: string | null
          media_license?: string | null
          media_source?: string | null
          muscle_groups?: Json
          name?: string
          primary_muscle?: string | null
          restrictions?: Json
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      foods_catalog: {
        Row: {
          allergens: Json
          calories_per_100g: number
          carbs_per_100g: number
          category: string
          created_at: string
          fats_per_100g: number
          id: string
          name: string
          protein_per_100g: number
          tags: Json
        }
        Insert: {
          allergens?: Json
          calories_per_100g: number
          carbs_per_100g: number
          category: string
          created_at?: string
          fats_per_100g: number
          id?: string
          name: string
          protein_per_100g: number
          tags?: Json
        }
        Update: {
          allergens?: Json
          calories_per_100g?: number
          carbs_per_100g?: number
          category?: string
          created_at?: string
          fats_per_100g?: number
          id?: string
          name?: string
          protein_per_100g?: number
          tags?: Json
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          status: Database["public"]["Enums"]["goal_status"]
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_workout_draft_days: {
        Row: {
          created_at: string
          draft_id: string
          id: string
          name: string
          order_number: number
        }
        Insert: {
          created_at?: string
          draft_id: string
          id?: string
          name: string
          order_number: number
        }
        Update: {
          created_at?: string
          draft_id?: string
          id?: string
          name?: string
          order_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "manual_workout_draft_days_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "manual_workout_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_workout_draft_exercises: {
        Row: {
          created_at: string
          draft_day_id: string
          exercise_id: string
          id: string
          order_number: number
          repetitions: string
          rest_seconds: number
          sets: number
        }
        Insert: {
          created_at?: string
          draft_day_id: string
          exercise_id: string
          id?: string
          order_number: number
          repetitions: string
          rest_seconds: number
          sets: number
        }
        Update: {
          created_at?: string
          draft_day_id?: string
          exercise_id?: string
          id?: string
          order_number?: number
          repetitions?: string
          rest_seconds?: number
          sets?: number
        }
        Relationships: [
          {
            foreignKeyName: "manual_workout_draft_exercises_draft_day_id_fkey"
            columns: ["draft_day_id"]
            isOneToOne: false
            referencedRelation: "manual_workout_draft_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_workout_draft_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_workout_drafts: {
        Row: {
          created_at: string
          id: string
          name: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          source: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_workout_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      muscle_groups: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      nutrition_item_selections: {
        Row: {
          created_at: string
          id: string
          meal_item_id: string
          quantity_grams: number
          selected_food_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_item_id: string
          quantity_grams: number
          selected_food_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_item_id?: string
          quantity_grams?: number
          selected_food_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_item_selections_meal_item_id_fkey"
            columns: ["meal_item_id"]
            isOneToOne: false
            referencedRelation: "nutrition_meal_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_item_selections_selected_food_id_fkey"
            columns: ["selected_food_id"]
            isOneToOne: false
            referencedRelation: "foods_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_item_selections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_meal_completions: {
        Row: {
          completed_on: string
          created_at: string
          id: string
          meal_id: string
          user_id: string
        }
        Insert: {
          completed_on?: string
          created_at?: string
          id?: string
          meal_id: string
          user_id: string
        }
        Update: {
          completed_on?: string
          created_at?: string
          id?: string
          meal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_meal_completions_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "nutrition_meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_meal_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_meal_items: {
        Row: {
          alternative_group: string | null
          created_at: string
          food_id: string
          id: string
          is_alternative: boolean
          meal_id: string
          quantity_grams: number
          role: string
          substitution_group: string | null
          weight_basis: string
        }
        Insert: {
          alternative_group?: string | null
          created_at?: string
          food_id: string
          id?: string
          is_alternative?: boolean
          meal_id: string
          quantity_grams: number
          role: string
          substitution_group?: string | null
          weight_basis?: string
        }
        Update: {
          alternative_group?: string | null
          created_at?: string
          food_id?: string
          id?: string
          is_alternative?: boolean
          meal_id?: string
          quantity_grams?: number
          role?: string
          substitution_group?: string | null
          weight_basis?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_meal_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "nutrition_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_meals: {
        Row: {
          created_at: string
          id: string
          meal_order: number
          name: string
          nutrition_plan_version_id: string
          suggested_time: string | null
          target_calories: number
        }
        Insert: {
          created_at?: string
          id?: string
          meal_order: number
          name: string
          nutrition_plan_version_id: string
          suggested_time?: string | null
          target_calories: number
        }
        Update: {
          created_at?: string
          id?: string
          meal_order?: number
          name?: string
          nutrition_plan_version_id?: string
          suggested_time?: string | null
          target_calories?: number
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_meals_nutrition_plan_version_id_fkey"
            columns: ["nutrition_plan_version_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plan_versions: {
        Row: {
          active: boolean
          calories: number
          carbs_grams: number
          created_at: string
          fats_grams: number
          generation_run_id: string
          id: string
          meal_count: number
          nutrition_plan_id: string
          precision_mode: string
          profile_snapshot: Json
          protein_grams: number
          reason: Database["public"]["Enums"]["workout_plan_version_reason"]
          version_number: number
        }
        Insert: {
          active?: boolean
          calories: number
          carbs_grams: number
          created_at?: string
          fats_grams: number
          generation_run_id: string
          id?: string
          meal_count?: number
          nutrition_plan_id: string
          precision_mode?: string
          profile_snapshot?: Json
          protein_grams: number
          reason: Database["public"]["Enums"]["workout_plan_version_reason"]
          version_number: number
        }
        Update: {
          active?: boolean
          calories?: number
          carbs_grams?: number
          created_at?: string
          fats_grams?: number
          generation_run_id?: string
          id?: string
          meal_count?: number
          nutrition_plan_id?: string
          precision_mode?: string
          profile_snapshot?: Json
          protein_grams?: number
          reason?: Database["public"]["Enums"]["workout_plan_version_reason"]
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plan_versions_generation_run_id_fkey"
            columns: ["generation_run_id"]
            isOneToOne: false
            referencedRelation: "plan_generation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_plan_versions_nutrition_plan_id_fkey"
            columns: ["nutrition_plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plans: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_answers: {
        Row: {
          answer_type: string
          answer_value: Json
          created_at: string
          id: string
          onboarding_session_id: string
          question_key: string
          question_version: string
          updated_at: string
        }
        Insert: {
          answer_type: string
          answer_value: Json
          created_at?: string
          id?: string
          onboarding_session_id: string
          question_key: string
          question_version?: string
          updated_at?: string
        }
        Update: {
          answer_type?: string
          answer_value?: Json
          created_at?: string
          id?: string
          onboarding_session_id?: string
          question_key?: string
          question_version?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_answers_onboarding_session_id_fkey"
            columns: ["onboarding_session_id"]
            isOneToOne: false
            referencedRelation: "onboarding_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_sessions: {
        Row: {
          auth_user_id: string | null
          completed_at: string | null
          converted_user_id: string | null
          expires_at: string
          id: string
          session_token_hash: string
          started_at: string
          status: Database["public"]["Enums"]["onboarding_session_status"]
        }
        Insert: {
          auth_user_id?: string | null
          completed_at?: string | null
          converted_user_id?: string | null
          expires_at?: string
          id?: string
          session_token_hash: string
          started_at?: string
          status?: Database["public"]["Enums"]["onboarding_session_status"]
        }
        Update: {
          auth_user_id?: string | null
          completed_at?: string | null
          converted_user_id?: string | null
          expires_at?: string
          id?: string
          session_token_hash?: string
          started_at?: string
          status?: Database["public"]["Enums"]["onboarding_session_status"]
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_sessions_auth_user_id_fkey"
            columns: ["auth_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_sessions_converted_user_id_fkey"
            columns: ["converted_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_generation_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          engine_version: string
          error_message: string | null
          id: string
          input_snapshot: Json
          run_type: Database["public"]["Enums"]["plan_generation_run_type"]
          status: Database["public"]["Enums"]["plan_generation_run_status"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          engine_version: string
          error_message?: string | null
          id?: string
          input_snapshot?: Json
          run_type: Database["public"]["Enums"]["plan_generation_run_type"]
          status?: Database["public"]["Enums"]["plan_generation_run_status"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          engine_version?: string
          error_message?: string | null
          id?: string
          input_snapshot?: Json
          run_type?: Database["public"]["Enums"]["plan_generation_run_type"]
          status?: Database["public"]["Enums"]["plan_generation_run_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_generation_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_rule_decisions: {
        Row: {
          created_at: string
          generation_run_id: string
          id: string
          input_data: Json
          output_data: Json
          rule_name: string
        }
        Insert: {
          created_at?: string
          generation_run_id: string
          id?: string
          input_data?: Json
          output_data?: Json
          rule_name: string
        }
        Update: {
          created_at?: string
          generation_run_id?: string
          id?: string
          input_data?: Json
          output_data?: Json
          rule_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_rule_decisions_generation_run_id_fkey"
            columns: ["generation_run_id"]
            isOneToOne: false
            referencedRelation: "plan_generation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_checkins: {
        Row: {
          checked_in_at: string
          created_at: string
          energy_score: number
          id: string
          nutrition_adherence: string
          notes: string | null
          pain_area: string | null
          pain_present: boolean
          pain_severity: number | null
          questionnaire_version: string
          sleep_score: number
          soreness_score: number
          stress_score: number
          training_adherence: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          created_at?: string
          energy_score: number
          id?: string
          nutrition_adherence: string
          notes?: string | null
          pain_area?: string | null
          pain_present?: boolean
          pain_severity?: number | null
          questionnaire_version?: string
          sleep_score: number
          soreness_score: number
          stress_score: number
          training_adherence: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checked_in_at?: string
          created_at?: string
          energy_score?: number
          id?: string
          nutrition_adherence?: string
          notes?: string | null
          pain_area?: string | null
          pain_present?: boolean
          pain_severity?: number | null
          questionnaire_version?: string
          sleep_score?: number
          soreness_score?: number
          stress_score?: number
          training_adherence?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number
          created_at: string
          current_weight_kg: number
          daily_activity: string
          days_per_week: number | null
          diet_preference: string
          disliked_foods: Json
          experience: string
          food_restrictions: Json
          height_cm: number
          id: string
          meal_count: number
          meals_out_slots: Json
          motivation: string | null
          name: string
          nutrition_plan_review_needed: boolean
          preferred_meal_styles: Json
          primary_goal: string
          priorities: Json
          restrictions: Json
          session_duration_minutes: number | null
          sex: string
          sleep_hours: number
          sleep_quality: string
          stress_level: string
          subscription_auto_renew: boolean
          subscription_plan: string
          subscription_renews_at: string | null
          subscription_started_at: string | null
          subscription_status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          target_weight_kg: number | null
          training_place: string | null
          updated_at: string
          user_id: string
          workout_plan_review_needed: boolean
          workout_planning_mode: string
        }
        Insert: {
          age: number
          created_at?: string
          current_weight_kg: number
          daily_activity: string
          days_per_week?: number | null
          diet_preference?: string
          disliked_foods?: Json
          experience: string
          food_restrictions?: Json
          height_cm: number
          id?: string
          meal_count?: number
          meals_out_slots?: Json
          motivation?: string | null
          name: string
          nutrition_plan_review_needed?: boolean
          preferred_meal_styles?: Json
          primary_goal: string
          priorities?: Json
          restrictions?: Json
          session_duration_minutes?: number | null
          sex: string
          sleep_hours: number
          sleep_quality: string
          stress_level: string
          subscription_auto_renew?: boolean
          subscription_plan?: string
          subscription_renews_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          target_weight_kg?: number | null
          training_place?: string | null
          updated_at?: string
          user_id: string
          workout_plan_review_needed?: boolean
          workout_planning_mode?: string
        }
        Update: {
          age?: number
          created_at?: string
          current_weight_kg?: number
          daily_activity?: string
          days_per_week?: number | null
          diet_preference?: string
          disliked_foods?: Json
          experience?: string
          food_restrictions?: Json
          height_cm?: number
          id?: string
          meal_count?: number
          meals_out_slots?: Json
          motivation?: string | null
          name?: string
          nutrition_plan_review_needed?: boolean
          preferred_meal_styles?: Json
          primary_goal?: string
          priorities?: Json
          restrictions?: Json
          session_duration_minutes?: number | null
          sex?: string
          sleep_hours?: number
          sleep_quality?: string
          stress_level?: string
          subscription_auto_renew?: boolean
          subscription_plan?: string
          subscription_renews_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          target_weight_kg?: number | null
          training_place?: string | null
          updated_at?: string
          user_id?: string
          workout_plan_review_needed?: boolean
          workout_planning_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          accepted: boolean
          accepted_at: string
          consent_type: Database["public"]["Enums"]["consent_type"]
          document_version: string
          id: string
          language: string
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          accepted: boolean
          accepted_at?: string
          consent_type: Database["public"]["Enums"]["consent_type"]
          document_version: string
          id?: string
          language?: string
          user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          accepted?: boolean
          accepted_at?: string
          consent_type?: Database["public"]["Enums"]["consent_type"]
          document_version?: string
          id?: string
          language?: string
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_equipment: {
        Row: {
          created_at: string
          equipment_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          equipment_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          equipment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_equipment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_priorities: {
        Row: {
          created_at: string
          muscle_group_id: string
          priority: number
          user_id: string
        }
        Insert: {
          created_at?: string
          muscle_group_id: string
          priority: number
          user_id: string
        }
        Update: {
          created_at?: string
          muscle_group_id?: string
          priority?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_priorities_muscle_group_id_fkey"
            columns: ["muscle_group_id"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_priorities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_days: {
        Row: {
          created_at: string
          id: string
          name: string
          order_number: number
          workout_plan_version_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_number: number
          workout_plan_version_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_number?: number
          workout_plan_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_days_workout_plan_version_id_fkey"
            columns: ["workout_plan_version_id"]
            isOneToOne: false
            referencedRelation: "workout_plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          order_number: number
          progression_level: number
          repetitions: string
          rest_seconds: number
          sets: number
          workout_day_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          order_number: number
          progression_level?: number
          repetitions: string
          rest_seconds: number
          sets: number
          workout_day_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          order_number?: number
          progression_level?: number
          repetitions?: string
          rest_seconds?: number
          sets?: number
          workout_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plan_versions: {
        Row: {
          active: boolean
          created_at: string
          generation_run_id: string
          id: string
          profile_snapshot: Json
          reason: Database["public"]["Enums"]["workout_plan_version_reason"]
          version_number: number
          workout_plan_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          generation_run_id: string
          id?: string
          profile_snapshot?: Json
          reason: Database["public"]["Enums"]["workout_plan_version_reason"]
          version_number: number
          workout_plan_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          generation_run_id?: string
          id?: string
          profile_snapshot?: Json
          reason?: Database["public"]["Enums"]["workout_plan_version_reason"]
          version_number?: number
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plan_versions_generation_run_id_fkey"
            columns: ["generation_run_id"]
            isOneToOne: false
            referencedRelation: "plan_generation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plan_versions_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          started_at: string
          user_id: string
          workout_day_id: string | null
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          started_at?: string
          user_id: string
          workout_day_id?: string | null
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          started_at?: string
          user_id?: string
          workout_day_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      },
      stripe_webhook_events: {
        Row: {
          event_type: string
          id: string
          processed: boolean
          processed_at: string | null
          received_at: string
        }
        Insert: {
          event_type: string
          id: string
          processed?: boolean
          processed_at?: string | null
          received_at?: string
        }
        Update: {
          event_type?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          received_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_type: "login" | "workout" | "weight" | "measurement"
      audit_action: "create" | "update" | "delete"
      consent_type:
        | "privacy_policy"
        | "terms_conditions"
        | "analytics"
        | "health_data"
      goal_status: "active" | "completed" | "cancelled"
      onboarding_session_status:
        | "active"
        | "completed"
        | "expired"
        | "converted"
      plan_generation_run_status: "pending" | "completed" | "failed"
      plan_generation_run_type:
        | "initial_generation"
        | "progress_adjustment"
        | "manual_regeneration"
      workout_plan_version_reason:
        | "onboarding"
        | "progress_adjustment"
        | "goal_change"
        | "equipment_change"
        | "injury_change"
        | "restriction_change"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: ["login", "workout", "weight", "measurement"],
      audit_action: ["create", "update", "delete"],
      consent_type: [
        "privacy_policy",
        "terms_conditions",
        "analytics",
        "health_data",
      ],
      goal_status: ["active", "completed", "cancelled"],
      onboarding_session_status: [
        "active",
        "completed",
        "expired",
        "converted",
      ],
      plan_generation_run_status: ["pending", "completed", "failed"],
      plan_generation_run_type: [
        "initial_generation",
        "progress_adjustment",
        "manual_regeneration",
      ],
      workout_plan_version_reason: [
        "onboarding",
        "progress_adjustment",
        "goal_change",
        "equipment_change",
        "injury_change",
        "restriction_change",
      ],
    },
  },
} as const
