import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { assets } from "../assets/assets";
import { UserContext } from '../context/UserContext';
import { FaArrowLeft } from "react-icons/fa"; 

const Verification = () => {
  const navigate = useNavigate();
  const bank = localStorage.getItem('bank') || "default";
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const email = storedUser?.email || "";
  const [purpose, setPurpose] = useState("login");
  const { setVToken, backendUrl, getBankTheme, sendWarning, blockUser, encryption } = useContext(UserContext);
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpAttempt, setOtpAttempt] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const bankLogos = {
    finova: assets?.finova,
    wissen: assets?.wissen,
    heritage: assets?.heritage,
  };

  const sendOtp = async () => {
    if (!email) {
      toast.error("Email not provided. Please go back and enter your email.");
      return;
    }

    try {
      setIsLoading(true); 
      await axios.post(backendUrl + '/users/sendotp', { email }, { withCredentials: true });
      setIsOtpSent(true);
      toast.success(`OTP sent to ${email}. Check your inbox.`);
    } catch (error) {
      toast.error("Failed to send OTP. Try again.");
      console.error("OTP Send Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();

    if (!isOtpSent) {
      toast.error("Please request an OTP first.");
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);
      
      if (otpAttempt + 1 < 5) {
        const encryptedOtp = encryption(otp);
        const encryptedEmail = encryption(email);
        const { data } = await axios.post(backendUrl + '/users/verifyotp', 
          { encryptedEmail, encryptedOtp, purpose }, 
          { withCredentials: true }
        );

        if (data.otpVerified) {
          localStorage.setItem('vToken', data.otp_token);
          setVToken(data.otp_token);
          toast.success("OTP verified successfully!");
          const currentTime = new Date().getTime();
          localStorage.setItem('lastTriggeredTime', currentTime);
          setTimeout(() => navigate("/user-dashboard"), 1000);
        } else {
          handleFailedAttempt();
          toast.error("Invalid OTP. Please try again.");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFailedAttempt = () => {
    setOtpAttempt(prev => prev + 1);
    const pur = "login";
    if (otpAttempt + 1 >= 2 && otpAttempt + 1 < 4) {
      toast.warning("You have made 2 or more incorrect attempts."); 
      sendWarning(pur);
    } else if (otpAttempt + 1 > 3 && otpAttempt + 1 < 5) {
      toast.error("You have made too many incorrect attempts. Please try again later.");
      const reason = "Multiple wrong OTP Attempts during login";
      blockUser(reason);
    }
  };

  useEffect(() => {
    sendOtp();
  }, []);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${getBankTheme(bank).background}`}>
      <div className={`bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md ${getBankTheme(bank).border}`}>
        {/* Bank Header*/}
        <div className={`${getBankTheme(bank).header} p-6 text-center relative`}>
          <button 
            onClick={() => {localStorage.removeItem('uToken'), navigate('/login'), window.location.reload()}}
            className="absolute left-4 top-6 text-white hover:text-gray-200 transition"
            aria-label="Go back to login"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <div className="flex justify-center mb-3">
            <img
              src={bankLogos[bank] || 'fallback-image.png'}
              alt={`${bank.toUpperCase()} Logo`}
              className="w-16 h-16 object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-white">Secure OTP Verification</h2>
        </div>

        {/* OTP Form */}
        <form onSubmit={verifyOtp} className="p-8">
          <div className="mb-6 text-center">
            <p className="text-gray-600 mb-6">
              We've sent a 6-digit code to <br />
              <strong className="text-gray-800">{email}</strong>
            </p>
            
            {/* OTP Input */}
            <div className="mb-8">
              <label htmlFor="otp" className="block text-gray-700 font-medium mb-3">Enter Verification Code</label>
              <div className="flex justify-center space-x-3">
                {[...Array(6)].map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    className={`w-12 h-12 text-2xl text-center border-2 rounded-lg focus:outline-none focus:ring-2 ${getBankTheme(bank).focus} transition`}
                    value={otp[i] || ''}
                    onChange={(e) => {
                      const newOtp = [...otp];
                      newOtp[i] = e.target.value.replace(/\D/g, '');
                      setOtp(newOtp.join(''));
                      if (e.target.value && i < 5) {
                        e.target.nextElementSibling?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otp[i] && i > 0) {
                        e.target.previousElementSibling?.focus();
                      }
                    }}
                    pattern="\d*"
                    inputMode="numeric"
                    required
                  />
                ))}
              </div>
            </div>

            {/* Verify Button*/}
            <button
              type="submit"
              className={`w-full ${getBankTheme(bank).button} text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md transition-all flex items-center justify-center`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  
                </>
              ) : (
                "Verify & Continue"
              )}
            </button>
          </div>
        </form>

        {/* Resend OTP Section */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 text-center">
          <p className="text-gray-600 mb-3">Didn't receive the code?</p>
          <button
            type="button"
            onClick={sendOtp}
            className={`text-sm ${getBankTheme(bank).link} font-medium`}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Resend OTP"}
          </button>
          <div className="mt-3 flex items-center justify-center space-x-2">
            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-gray-600">Protected with strong encryption for added security.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verification;