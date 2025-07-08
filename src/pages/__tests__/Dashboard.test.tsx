import { render, screen, waitFor } from "@testing-library/react";
import Dashboard from "../Dashboard";
import * as tasksApi from "@/utils/api/tasks-api";
import * as projectsApi from "@/utils/api/projects-api";
import * as usersApi from "@/utils/api/users-api";
import * as eventsApi from "@/utils/api/events-api";
import { AuthProvider } from "@/contexts/AuthContext";
import React from "react";
import { MemoryRouter } from "react-router-dom";

function renderWithAuthProvider(ui) {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

describe("Dashboard", () => {
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

  it("renders fallback avatar when name/profile_picture missing", async () => {
    vi.spyOn(tasksApi, "getUserTasks").mockResolvedValue({ tasks: [] });
    vi.spyOn(projectsApi, "getProjects").mockResolvedValue({ projects: [
      { id: 1, title: "Project 1", members: [{ user_id: "1" }] },
    ] });
    vi.spyOn(projectsApi, "getProjectTasks").mockResolvedValue({ tasks: [] });
    vi.spyOn(usersApi, "getUserById").mockResolvedValue({ data: { name: "", profile_picture: "" } });
    vi.spyOn(eventsApi, "getEvents").mockResolvedValue({ events: [] });

    renderWithAuthProvider(<Dashboard />);
    await waitFor(() => {
      expect(screen.getAllByText("M").length).toBeGreaterThan(0);
    });
  });

  it("shows the correct number of events in Upcoming Events", async () => {
    vi.spyOn(tasksApi, "getUserTasks").mockResolvedValue({ tasks: [] });
    vi.spyOn(projectsApi, "getProjects").mockResolvedValue({ projects: [] });
    vi.spyOn(projectsApi, "getProjectTasks").mockResolvedValue({ tasks: [] });
    vi.spyOn(usersApi, "getUserById").mockResolvedValue({ data: { name: "", profile_picture: "" } });
    vi.spyOn(eventsApi, "getEvents").mockResolvedValue({ events: [
      { id: 1, title: "Event 1", date: "2025-05-15T06:00:00", type: "meeting" },
      { id: 2, title: "Event 2", date: "2025-05-20T06:00:00", type: "deadline" },
      { id: 3, title: "Event 3", date: "2025-05-25T06:00:00", type: "event" },
      { id: 4, title: "Event 4", date: "2025-05-30T06:00:00", type: "event" },
    ] });

    renderWithAuthProvider(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText("Event 1")).toBeInTheDocument();
      expect(screen.getByText("Event 2")).toBeInTheDocument();
      expect(screen.getByText("Event 3")).toBeInTheDocument();
      expect(screen.queryByText("Event 4")).not.toBeInTheDocument();
    });
  });

  it("renders 'View all' and 'View Calendar' buttons", async () => {
    vi.spyOn(tasksApi, "getUserTasks").mockResolvedValue({ tasks: [] });
    vi.spyOn(projectsApi, "getProjects").mockResolvedValue({ projects: [] });
    vi.spyOn(projectsApi, "getProjectTasks").mockResolvedValue({ tasks: [] });
    vi.spyOn(usersApi, "getUserById").mockResolvedValue({ data: { name: "", profile_picture: "" } });
    vi.spyOn(eventsApi, "getEvents").mockResolvedValue({ events: [] });

    renderWithAuthProvider(<Dashboard />);
    expect(await screen.findByText("View all")).toBeInTheDocument();
    expect(await screen.findByText("View Calendar")).toBeInTheDocument();
  });
}); 