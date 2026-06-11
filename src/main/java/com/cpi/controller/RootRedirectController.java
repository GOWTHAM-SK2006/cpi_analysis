package com.cpi.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Handles the root URL (/) by redirecting to the login page.
 *
 * In a stateless JWT app, browser navigation to / never carries an
 * Authorization header, so @AuthenticationPrincipal is always null.
 * The authenticated redirect to /dashboard.html is handled client-side
 * by login.js (via redirectIfLoggedIn() which checks localStorage).
 */
@Controller
public class RootRedirectController {

    @GetMapping("/")
    public String root() {
        return "redirect:/login.html";
    }
}
