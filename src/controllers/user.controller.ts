import secrets from '@/config/secrets';
import User from '@/models/users/user.model';
import { sendSMS, verifyOTP } from '@/services/twilio.services';
import { UserStatus } from '@/typings/enums';
import cookieToken from '@/utils/cookie-token';
import CoffeeError from '@/utils/custom-error';
import toIND from '@/utils/to-ind';
import { NextFunction, Request, Response } from 'express';
import Play from '@/models/play.model';
import Audio from '@/models/audio.model';

type P = {
  rq: Request;
  rs: Response;
  n: NextFunction;
};
let userRecentlyPlayed=undefined;
/**
 * Find All Users
 * @param req
 * @param res
 * @param next
 */

export const getAllUsers = async (req: P['rq'], res: P['rs']) => {
  try {
    const user = await User.find({});
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json(error);
  }
};
/**
 * Find User by ID
 * @param req
 * @param res
 * @param next
 */
export const getUserById = async (req: P['rq'], res: P['rs']) => {
  try {
    const user = await User.findById({ _id: req.params.user_id });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json(error);
  }
};
/**
 * Delete User by ID
 * @param req
 * @param res
 * @param next
 */
export const deleteUserById = async (req: P['rq'], res: P['rs']) => {
  try {
    const user = await User.deleteOne({ phone: req.params.phone });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json(error);
  }
};
/**
 * Sign Up User
 * @param req
 * @param res
 * @param next
 * @returns
 */
export const signUp = async (req: P['rq'], res: P['rs'], next: P['n']) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) {
    return next(new CoffeeError('Required', 400));
  }
  try {
    /**
     * For Sending OTP to the user phone
     */
    const india = toIND(phone);
    await sendSMS(india);
    const user = await User.create({
      name,
      phone,
      password,
     
    });
    await cookieToken<typeof user>(user, res);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json(error);
  }
};
/**
 * Confirm OTP
 * @param req
 * @param res
 * @param next
 * @returns
 */
export const confirmOTP = async (req: P['rq'], res: P['rs'], next: P['n']) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return next(new CoffeeError('OTP is required', 400));
  }
  try {
    const india = toIND(phone);
    const response = await verifyOTP(india, otp);
    if (response.status === UserStatus.APPROVED) {
      const user = await User.findOneAndUpdate(
        { phone },
        { status: UserStatus.APPROVED },
        { new: true }
      );

      user.save();
      res.status(200).json(user);   
    }
  } catch (error) {
    res.status(500).json(error);
  }
};
/**
 * Sign In User
 * @param req
 * @param res
 * @param next
 * @returns
 */

export const signIn = async (req: P['rq'], res: P['rs']) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(401).json("Email and password Required");
    }
    if (phone.length < 10) {
      return res.status(401).json("Invalid Phone Number");
    }
    const user = await User.findOne({ phone }).select('+password');
    if (!user) {
      return res.status(401).json("User not found");
    }
    const isCorrectPassword = await user.checkValidPassword(password);
    if (!isCorrectPassword) {
      return res.status(401).json("Invalid Password");
    }
    const token=await cookieToken(user,res);

    // Retrieve recently played songs for the user
    const userId = user._id;
    const userRecentlyPlayed = await Play.find({ userId }).sort({ timestamp: -1 });

    // Respond with user information and recently played songs
    // return res.json({ userRecentlyPlayed });
    const result={
      token,
      user,
      userRecentlyPlayed
    }
    res.status(200).json({ result });
  } catch (error) {
    // Handle errors here and send an error response
    console.error(error);
    return res.status(500).json("Internal Server Error");
  }
};


export const play = async (req, res) => {
  try {
    const { userId, songId } = req.body;
    console.log(userId);
    const timestamp = new Date();
    const song= await Audio.findById(songId)
    const newSong = new Play({ userId, songId:song.file, image:song.image, timestamp });
    await newSong.save();
    res.status(200).json({ message: "Song played successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error logging the song" });
  }
};

// Retrieve a user's recently played songs
export const recentlyPlayed = async (req, res) => {
  try {
    const { userId } = req.params;

    // Retrieve recently played songs for the user
  //  const userRecentlyPlayed = await Play.find({ userId }).sort({ timestamp: -1 });

  userRecentlyPlayed = await Play.find({ userId }).sort({ timestamp: -1 });


    res.status(200).json({ userRecentlyPlayed });
  } catch (error) {
    console.error(error); 
    res.status(500).json({ error: 'Error retrieving recently played songs' });
  }
};

/**
 * Log Out User
 * @param req
 * @param res
 * @param next
 */
export const logOut = async (req: P['rq'], res: P['rs'], next: P['n']) => {
  res.cookie(secrets.token, null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: 'Logout User Successfully',
  });
};


export const forgetPassword = async (req: P['rq'], res: P['rs'], next: P['n']) => {
  const { phone } = req.body;
  if (!phone ) {
    return next(new CoffeeError('mobile number Required', 400));
  }
  const user = await User.findOne({ phone });
  if(!user) {
    // return next(new CoffeeError('User not found', 500));
    res.status(500).json('User not found')
  }
  try {
    /**
     * For Sending OTP to the user phone
     */
    const india = toIND(phone);
    await sendSMS(india);
    res.json("OTP has been sent")
  } catch (error) {
    res.status(500).json(error);
  }
};


export const resetPassword = async (req: P['rq'], res: P['rs'], next: P['n']) => {
  const { newpassword, phone, otp } = req.body;
  if (!newpassword || !otp || !phone) {
    return next(new CoffeeError('OTP is required', 400));
  }
 
  const user = await User.findOne({ phone });
  
  if (!user) {
    return next(new CoffeeError('User not found', 404));
  }else{
    console.log(user);
  }
    
  try {
    const india = toIND(phone);
    const response = await verifyOTP(india, otp);
    console.log(response);
    if (response) {
      // Find the user by phone number and update the password
      // const user = await User.findOne({ phone: phone });
    
      // Update the password
      user.password = newpassword;

      // Save the user object to persist the new password
      await user.save();

      res.status(200).json(user);
      console.log(newpassword)
    } else {
      // Handle the case when OTP verification fails
      return next(new CoffeeError('OTP verification failed', 400));
    }
  } catch (error) {
    res.status(500).json(error);
  }
};
