import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();
async function fetchUserProfile(userId, userRole) {
    const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', userId)
        .single();
    
    if (profileError) {
        console.error("Error fetching public user profile:", profileError);
        return null;
    }

    let companyProfile = null;
    if (userRole === 'company') {
        const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('id, business_name, languages_supported, rates, is_verified')
            .eq('user_id', userId)
            .single();
        
        if (companyError && companyError.code !== 'PGRST116') { 
            console.warn("Error fetching company profile:", companyError);
        }
        companyProfile = companyData || null;
    }

    return { ...userProfile, companyProfile };
}


router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const role = 'customer'; 

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password required' });
        }
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { role: role } 
            }
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        const authUser = data.user;
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: authUser.id,
                name: name,
                email: email,
                role: role
            });

        if (insertError) {
            console.error("Public DB insert error. Rolling back auth user if possible.", insertError);
            return res.status(500).json({ error: 'User registration failed in profile database.' });
        }
        res.status(201).json({ 
            user: {
                id: authUser.id,
                name: name,
                email: email,
                role: role
            } 
        });
        
    } catch (err) {
        console.error('Register error', err);
        res.status(500).json({ error: 'Server error' });
    }
});


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email & password required' });
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            console.log(error);
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const session = data.session;
        const authUser = data.user;
        const userRole = authUser.user_metadata.role || 'customer';
        const userProfile = await fetchUserProfile(authUser.id, userRole);

        if (!userProfile) {
            return res.status(404).json({ error: 'User profile not found.' });
        }
        res.json({
            token: session.access_token, 
            user: {
                id: userProfile.id,
                name: userProfile.name,
                email: userProfile.email,
                role: userProfile.role,
                companyProfile: userProfile.companyProfile || null, 
            },
        });
        
    } catch (err) {
        console.error('Login error', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;