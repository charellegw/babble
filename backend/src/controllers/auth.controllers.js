import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import { generateToken, setCookie } from "../utils/token.js";

export async function signup(req, res) {
    const {email, password, fullName} = req.body;

    try {
        if(!email || !password || !fullName){
            return res.status(400).json({message: "All fields as required"});
        }
    
        if(password.length < 6){
            return res.status(400).json({message: "Password must be at least 6 characters"});
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({message: "Invalid email format"});
        }
    
        const isExist = await User.findOne({email});
        if(isExist){
            return res.status(400).json({message: "Email already registered, please use a different email"})
        }
    
        const rand = Math.floor(Math.random() * 100) + 1;
        const randAvatar = `https://avatar.iran.liara.run/public/${rand}.png`;
    
        const newUser = await User.create({
            fullName, 
            email, 
            password, 
            profilePic: randAvatar,
        })  
        
        try {
            await upsertStreamUser({
                id:newUser._id.toString(),
                name: newUser.fullName,
                image: newUser.profilePic || "",
            });
            console.log(`Stream user created for ${newUser.fullName}`);
        } catch (error) {
            console.error("Error creating Stream user:", error);
        }

        setCookie(res, newUser._id);

        res.status(201).json({success: true, user: newUser});
    } catch (error) {
        console.log("Error in signup controller", error);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;
        if(!email || !password){
            return res.status(400).json({message: "All fields are required"});
        }

        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({message: "Invalid email or password"});
        }

        const isPasswordCorrect = await user.matchPassword(password);
        if(!isPasswordCorrect){
            return res.status(401).json({message: "Invalid email or password"});
        }

        setCookie(res, user._id);

        res.status(200).json({success: true, user});
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export async function logout(req, res) {
    res.clearCookie("jwt");
    res.status(200).json({success: true, message: "Logout successful"});
}