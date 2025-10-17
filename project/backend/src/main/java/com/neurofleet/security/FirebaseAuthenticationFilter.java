package com.neurofleet.security;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class FirebaseAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        System.out.println("FirebaseAuthenticationFilter processing request: " + request.getRequestURI());
        
        // Allow requests through if Firebase was not initialised (development mode)
        if (FirebaseApp.getApps().isEmpty()) {
            System.out.println("Firebase not initialized, allowing request through");
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");
        System.out.println("Authorization header: " + header);
        
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            System.out.println("Processing Firebase token");
            try {
                FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(token);
                System.out.println("Token verified for user: " + decoded.getUid());
                
                // Create authorities list with default ROLE_USER
                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                
                // Check if user has admin claim
                if (decoded.getClaims().containsKey("role") && 
                    "admin".equals(decoded.getClaims().get("role"))) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                }
                
                Authentication auth = new UsernamePasswordAuthenticationToken(
                    decoded.getUid(), 
                    null, 
                    authorities
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception e) {
                System.err.println("Failed to verify Firebase token: " + e.getMessage());
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
        } else {
            System.out.println("No valid Authorization header found");
        }
        filterChain.doFilter(request, response);
    }
}