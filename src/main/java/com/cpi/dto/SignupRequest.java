package com.cpi.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class SignupRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Academy name is required")
    private String academyName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
}
