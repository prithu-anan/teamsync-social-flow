import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import MyProjects from "../MyProjects";
import * as projectsApi from "@/utils/api/projects-api";
import * as usersApi from "@/utils/api/users-api";
import { AuthProvider } from "@/contexts/AuthContext";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

function renderWithAuthProvider(ui) {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

describe("MyProjects", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => {
        if (key === 'teamsync_user') return JSON.stringify({ id: 1, name: 'Test User' });
        if (key === 'teamsync_jwt') return 'fake-jwt';
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading state initially", () => {
    vi.spyOn(projectsApi, "getProjects").mockImplementation(() => new Promise(() => {}));
    
    renderWithAuthProvider(<MyProjects />);
    
    expect(screen.getByText("My Projects")).toBeInTheDocument();
    expect(screen.getByText("Loading projects...")).toBeInTheDocument();
  });

  it("renders projects from API", async () => {
    vi.spyOn(projectsApi, "getProjects").mockResolvedValue({
      projects: [
        {
          id: 1,
          title: "Project 1",
          members: [{ user_id: 1 }, { user_id: 2 }],
          created_at: "2024-01-01T00:00:00Z",
          deadline: "2024-02-01T00:00:00Z"
        },
        {
          id: 2,
          title: "Project 2", 
          members: [{ user_id: 1 }],
          created_at: "2024-01-15T00:00:00Z",
          deadline: "2024-03-01T00:00:00Z"
        }
      ]
    });
    
    vi.spyOn(projectsApi, "getProjectTasks").mockResolvedValue({
      tasks: [
        { id: 1, status: "done" },
        { id: 2, status: "todo" }
      ]
    });
    
    vi.spyOn(usersApi, "getUserById").mockImplementation(async (id) => ({
      data: { name: `User ${id}`, profile_picture: "" }
    }));

    renderWithAuthProvider(<MyProjects />);

    await waitFor(() => {
      expect(screen.getByText("Project 1")).toBeInTheDocument();
      expect(screen.getByText("Project 2")).toBeInTheDocument();
      expect(screen.getAllByText("Created by User 1").length).toBe(2);
    });
  });

  it("shows empty state when user is not a member of any projects", async () => {
    vi.spyOn(projectsApi, "getProjects").mockResolvedValue({
      projects: [
        {
          id: 1,
          title: "Other Project",
          members: [{ user_id: 999 }], // Different user
          created_at: "2024-01-01T00:00:00Z"
        }
      ]
    });

    renderWithAuthProvider(<MyProjects />);

    await waitFor(() => {
      expect(screen.getByText("You are not a member of any projects yet.")).toBeInTheDocument();
    });
  });

  it("filters projects by search query", async () => {
    vi.spyOn(projectsApi, "getProjects").mockResolvedValue({
      projects: [
        {
          id: 1,
          title: "Website Project",
          members: [{ user_id: 1 }],
          created_at: "2024-01-01T00:00:00Z"
        },
        {
          id: 2,
          title: "Mobile App",
          members: [{ user_id: 1 }],
          created_at: "2024-01-15T00:00:00Z"
        }
      ]
    });
    
    vi.spyOn(projectsApi, "getProjectTasks").mockResolvedValue({ tasks: [] });
    vi.spyOn(usersApi, "getUserById").mockResolvedValue({
      data: { name: "Test User", profile_picture: "" }
    });

    renderWithAuthProvider(<MyProjects />);

    await waitFor(() => {
      expect(screen.getByText("Website Project")).toBeInTheDocument();
      expect(screen.getByText("Mobile App")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search projects...");
    fireEvent.change(searchInput, { target: { value: "Website" } });

    expect(screen.getByText("Website Project")).toBeInTheDocument();
    expect(screen.queryByText("Mobile App")).not.toBeInTheDocument();
  });

  it("filters projects by status", async () => {
    vi.spyOn(projectsApi, "getProjects").mockResolvedValue({
      projects: [
        {
          id: 1,
          title: "Completed Project",
          members: [{ user_id: 1 }],
          created_at: "2024-01-01T00:00:00Z"
        },
        {
          id: 2,
          title: "In Progress Project",
          members: [{ user_id: 1 }],
          created_at: "2024-01-15T00:00:00Z"
        }
      ]
    });
    
    // Mock different progress for each project
    vi.spyOn(projectsApi, "getProjectTasks")
      .mockImplementation(async (id) => {
        if (id === 1) {
          return { tasks: [{ status: "done" }, { status: "done" }] }; // 100% complete
        } else {
          return { tasks: [{ status: "done" }, { status: "todo" }] }; // 50% complete
        }
      });
    
    vi.spyOn(usersApi, "getUserById").mockResolvedValue({
      data: { name: "Test User", profile_picture: "" }
    });

    renderWithAuthProvider(<MyProjects />);

    await waitFor(() => {
      expect(screen.getByText("Completed Project")).toBeInTheDocument();
      expect(screen.getByText("In Progress Project")).toBeInTheDocument();
    });

    // Filter by completed
    const filterSelect = screen.getByRole("combobox");
    fireEvent.click(filterSelect);
    
    const completedOption = screen.getByText("Completed");
    fireEvent.click(completedOption);

    expect(screen.getByText("Completed Project")).toBeInTheDocument();
    expect(screen.queryByText("In Progress Project")).not.toBeInTheDocument();
  });

  it("renders project cards with correct information", async () => {
    vi.spyOn(projectsApi, "getProjects").mockResolvedValue({
      projects: [
        {
          id: 1,
          title: "Test Project",
          members: [{ user_id: 1 }, { user_id: 2 }],
          created_at: "2024-01-01T00:00:00Z",
          deadline: "2024-02-01T00:00:00Z"
        }
      ]
    });
    
    vi.spyOn(projectsApi, "getProjectTasks").mockResolvedValue({
      tasks: [
        { id: 1, status: "done" },
        { id: 2, status: "todo" }
      ]
    });
    
    vi.spyOn(usersApi, "getUserById").mockImplementation(async (id) => ({
      data: { name: `User ${id}`, profile_picture: "" }
    }));

    renderWithAuthProvider(<MyProjects />);

    await waitFor(() => {
      expect(screen.getByText("Test Project")).toBeInTheDocument();
      expect(screen.getByText("Created by User 1")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument(); // 1 out of 2 tasks completed
      expect(screen.getByText("Created: Jan 1, 2024")).toBeInTheDocument();
      expect(screen.getByText("Deadline: Feb 1, 2024")).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    vi.spyOn(projectsApi, "getProjects").mockRejectedValue(new Error("API Error"));

    renderWithAuthProvider(<MyProjects />);

    await waitFor(() => {
      expect(screen.getByText("You are not a member of any projects yet.")).toBeInTheDocument();
    });
  });

  it("renders avatars with fallbacks when profile pictures are missing", async () => {
    vi.spyOn(projectsApi, "getProjects").mockResolvedValue({
      projects: [
        {
          id: 1,
          title: "Test Project",
          members: [{ user_id: 1 }, { user_id: 2 }],
          created_at: "2024-01-01T00:00:00Z"
        }
      ]
    });
    
    vi.spyOn(projectsApi, "getProjectTasks").mockResolvedValue({ tasks: [] });
    
    vi.spyOn(usersApi, "getUserById").mockImplementation(async (id) => ({
      data: { 
        name: id === 1 ? "John Doe" : "Jane Smith", 
        profile_picture: null 
      }
    }));

    renderWithAuthProvider(<MyProjects />);

    await waitFor(() => {
      // Check that avatar fallbacks are rendered
      const avatars = screen.getAllByText("JD"); // John Doe initials
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  it("shows no projects message when search has no results", async () => {
    vi.spyOn(projectsApi, "getProjects").mockResolvedValue({
      projects: [
        {
          id: 1,
          title: "Website Project",
          members: [{ user_id: 1 }],
          created_at: "2024-01-01T00:00:00Z"
        }
      ]
    });
    
    vi.spyOn(projectsApi, "getProjectTasks").mockResolvedValue({ tasks: [] });
    vi.spyOn(usersApi, "getUserById").mockResolvedValue({
      data: { name: "Test User", profile_picture: "" }
    });

    renderWithAuthProvider(<MyProjects />);

    await waitFor(() => {
      expect(screen.getByText("Website Project")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search projects...");
    fireEvent.change(searchInput, { target: { value: "NonExistent" } });

    expect(screen.getByText("No projects match your search criteria.")).toBeInTheDocument();
    expect(screen.queryByText("Website Project")).not.toBeInTheDocument();
  });
}); 