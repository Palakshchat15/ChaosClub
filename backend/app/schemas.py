from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class AuthResponse(BaseModel):
    token: str
    user_id: int
    name: str
    role: str
    avatar_url: str | None = None


class Article(BaseModel):
    id: int
    category: str
    title: str
    excerpt: str
    created_at: datetime
    scheduled_at: datetime
    author: str
    author_avatar_url: str | None = None
    image_url: str | None = None
    title_image_url: str | None = None
    context_images: list[str] = Field(default_factory=list)
    content: str | None = None


class ArticleCreateRequest(BaseModel):
    category: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=180)
    excerpt: str = Field(min_length=1, max_length=280)
    content: str = Field(min_length=1, max_length=5000000)
    title_image_url: str | None = None
    context_images: list[str] = Field(default_factory=list)
    scheduled_at: datetime | None = None


class Match(BaseModel):
    id: int
    external_id: int | None = None
    home_team: str
    away_team: str
    kickoff_at: datetime
    status: str
    competition: str | None = None
    venue: str | None = None


class PredictionRequest(BaseModel):
    user_id: int
    result_pick: str
    home_goals: int = Field(ge=0, le=20)
    away_goals: int = Field(ge=0, le=20)
    goalscorers: list[str] = Field(default_factory=list)


class MatchCreateRequest(BaseModel):
    home_team: str = Field(min_length=2, max_length=80)
    away_team: str = Field(min_length=2, max_length=80)
    kickoff_at: datetime
    competition: str = Field(min_length=2, max_length=120)
    venue: str = Field(min_length=2, max_length=120)


class MatchResultRequest(BaseModel):
    home_goals: int = Field(ge=0, le=20)
    away_goals: int = Field(ge=0, le=20)
    goalscorers: list[str] = Field(default_factory=list)


class PredictionView(BaseModel):
    match_id: int
    user_id: int
    result_pick: str
    home_goals: int
    away_goals: int
    goalscorers: list[str]
    locked_at: datetime


class RewardResult(BaseModel):
    user_id: int
    match_id: int
    result_points: int
    scoreline_points: int
    goalscorer_points: int
    total_points: int
    eligible_for_gift: bool


class RewardLogResponse(RewardResult):
    id: int
    fan_name: str
    created_at: datetime


class LeaderboardRow(BaseModel):
    rank: int
    fan: str
    points: int
    avatar_url: str | None = None


class UpdateAvatarRequest(BaseModel):
    avatar_url: str


class CommentCreateRequest(BaseModel):
    user_id: int
    body: str = Field(min_length=1, max_length=2000)


class CommentResponse(BaseModel):
    id: int
    article_id: int
    user_id: int
    author: str
    body: str
    created_at: datetime
    avatar_url: str | None = None


class ArticleUpdateRequest(BaseModel):
    category: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=180)
    excerpt: str = Field(min_length=1, max_length=280)
    content: str = Field(min_length=1, max_length=5000000)
    title_image_url: str | None = None
    context_images: list[str] = Field(default_factory=list)
    scheduled_at: datetime | None = None


class FunZoneConfigRequest(BaseModel):
    riddle: str = "{}"
    rumor: str = "{}"
    charades: str = "{}"
    var_room: str = "{}"
    on_this_day: str = "{}"
    prediction: str = "{}"
    tic_tac_toe: str = "{}"
    scheduled_at: datetime | None = None


class FunZoneConfigResponse(FunZoneConfigRequest):
    id: int
    updated_at: datetime
    scheduled_at: datetime


class SendCodeRequest(BaseModel):
    email: EmailStr


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class UserUpdateBioRequest(BaseModel):
    bio: str = Field(max_length=500)


class UserStats(BaseModel):
    total_points: int
    monthly_points: int
    total_predictions: int
    correct_results: int
    perfect_scores: int
    accuracy_percentage: float


class UserProfileResponse(BaseModel):
    id: int
    name: str
    avatar_url: str | None = None
    bio: str | None = None
    badges: list[str] = Field(default_factory=list)
    stats: UserStats
