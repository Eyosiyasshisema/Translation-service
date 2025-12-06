import { supabase } from '../config/supabase.js';

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

export const register = async (req, res) => {
    const { email, password, name, role } = req.body; 
    if (!name || !email || !password || (role !== 'company' && role !== 'admin')) {
        return res.status(400).json({ error: 'Missing required fields or invalid role.' });
    }

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { name: name, role: role } 
            }
        });

        if (authError) return res.status(400).json({ error: authError.message });

        const authUser = authData.user;
        const { error: userInsertError } = await supabase
            .from('users')
            .insert({
                id: authUser.id, 
                name: name,
                email: email,
                role: role
            });
            
        if (userInsertError) {
            console.error("Failed to insert into public.users:", userInsertError);
            return res.status(500).json({ error: 'Failed to create user profile record.' });
        }
        if (role === 'company') {
            const { error: companyInsertError } = await supabase
                .from('companies')
                .insert({ 
                    user_id: authUser.id, 
                    business_name: name 
                });
            
            if (companyInsertError) {
                console.error("Failed to insert into public.companies:", companyInsertError);
                return res.status(500).json({ error: 'Failed to create company profile details.' });
            }
        }
        res.status(201).json({ message: "User registered!", user: { id: authUser.id, name, email, role } });

    } catch (err) {
        console.error('Register error', err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (authError) return res.status(401).json({ error: authError.message });

        const session = authData.session;
        const authUser = authData.user;
        const userRole = authUser.user_metadata.role;
        const fullProfile = await fetchUserProfile(authUser.id, userRole);

        if (!fullProfile) {
             return res.status(404).json({ error: 'User profile data missing.' });
        }

        res.json({
            token: session.access_token,
            user: {
                id: fullProfile.id,
                name: fullProfile.name,
                email: fullProfile.email,
                role: fullProfile.role,
                companyProfile: fullProfile.companyProfile || null, 
            },
        });

    } catch (err) {
        console.error('Login error', err);
        res.status(500).json({ error: 'Server error' });
    }
};