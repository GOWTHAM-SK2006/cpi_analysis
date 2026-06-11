package com.cpi.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class RootRedirectController {

    @GetMapping("/")
    public String redirect(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails != null) {
            // User is authenticated, redirect to the dashboard
            return "redirect:/dashboard.html";
        }
        // User is not authenticated, redirect to the login page
        return "redirect:/login.html";
    }
}
