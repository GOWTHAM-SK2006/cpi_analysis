package com.cpi.controller;

import com.cpi.dto.*;
import com.cpi.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/player/{playerId}")
    public ResponseEntity<?> getPlayerReport(@PathVariable Long playerId,
                                              @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(reportService.getPlayerDetail(playerId, user.getUsername()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/team/{teamId}")
    public ResponseEntity<?> getTeamReport(@PathVariable Long teamId,
                                            @AuthenticationPrincipal UserDetails user) {
        try {
            return ResponseEntity.ok(reportService.getTeamReport(teamId, user.getUsername()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    record ErrorResponse(String message) {}
}
