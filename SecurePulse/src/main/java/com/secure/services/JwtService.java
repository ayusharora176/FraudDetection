package com.secure.services;





import com.auth0.jwt.JWT;


import com.auth0.jwt.algorithms.Algorithm;


import com.auth0.jwt.interfaces.DecodedJWT;


import com.auth0.jwt.interfaces.JWTVerifier;


import com.secure.model.User;





import jakarta.servlet.http.Cookie;


import jakarta.servlet.http.HttpServletRequest;


import org.springframework.stereotype.Service;


import java.util.Date;





@Service
public class JwtService {





    private static final String SECRET_KEY = "07nk94rplj"; // Use a secure key


    private static final String AUTH_COOKIE_NAME = "auth_token";


    private static final String OTP_COOKIE_NAME = "otp_token"; // New cookie for OTP verification





    // ✅ Generate JWT Token for Authentication


    public String generateToken(User user, String userBank) {


        return JWT.create()


                .withSubject(user.getEmail())


                .withClaim("userId", user.getUserId())


                .withClaim("email", user.getEmail())


                .withClaim("aadharCard", user.getAadharCard())


                .withClaim("panCard", user.getPanCard())


                .withClaim("phoneNumber", user.getPhoneNumber())


                .withClaim("userBank", userBank) // Include userBank for dynamic DB switching


                .withIssuedAt(new Date())


                .withExpiresAt(new Date(System.currentTimeMillis() + 60 * 60 * 1000)) // 1 Hour Expiry


                .sign(Algorithm.HMAC256(SECRET_KEY));


    }





    // ✅ New: Generate OTP Token with isVerified = true


    public String generateOtpToken(String email) {


        return JWT.create()


                .withSubject(email)


                .withClaim("isVerified", true)


                .withIssuedAt(new Date())


                .withExpiresAt(new Date(System.currentTimeMillis() + 60 * 60 * 1000)) // 15 min expiry


                .sign(Algorithm.HMAC256(SECRET_KEY));


    }





    // ✅ Extract Claims from JWT Token


    public DecodedJWT extractClaims(String token) {
        try {
            JWTVerifier verifier = JWT.require(Algorithm.HMAC256(SECRET_KEY)).build();
            return verifier.verify(token);
        } catch (com.auth0.jwt.exceptions.TokenExpiredException e) {
            System.out.println("❌ Token has expired: " + e.getMessage());
        } catch (com.auth0.jwt.exceptions.SignatureVerificationException e) {
            System.out.println("❌ Invalid token signature: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("❌ Token verification failed: " + e.getMessage());
        }
        return null; // Return null if token is invalid or expired
    }









    // ✅ Validate JWT Token


    public boolean validateToken(String token) {

        return extractClaims(token) != null;

    }





    // ✅ Extract JWT or OTP Token from Cookies


    public String extractTokenFromCookies(HttpServletRequest request, String cookieName) {


        if (request.getCookies() != null) {


            for (Cookie cookie : request.getCookies()) {


                if (cookieName.equals(cookie.getName())) {


                    return cookie.getValue(); // Return JWT token from cookie


                }


            }


        }


        return null; // Return null if no JWT token is found


    }





    // ✅ Extract `auth_token`


    public String extractAuthToken(HttpServletRequest request) {


        return extractTokenFromCookies(request, AUTH_COOKIE_NAME);


    }





    // ✅ Extract `otp_token`


    public String extractOtpToken(HttpServletRequest request) {


        return extractTokenFromCookies(request, OTP_COOKIE_NAME);


    }


}