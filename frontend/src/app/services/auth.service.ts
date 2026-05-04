import { Injectable, signal } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.supabase = createClient(
      'YOUR_SUPABASE_URL', // Replace with actual URL
      'YOUR_SUPABASE_ANON_KEY' // Replace with actual key
    );

    // Check for existing session
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentUserSubject.next(session?.user ?? null);
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentUserSubject.next(session?.user ?? null);
    });
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  getCurrentUser() {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.user_metadata?.role === 'admin';
  }
}